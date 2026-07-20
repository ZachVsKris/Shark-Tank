"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Player = {
  id: string;
  displayName: string;
  cash: number;
  ready: boolean;
  isHost: boolean;
  submitted: boolean;
  portfolioValue: number;
};

type Company = {
  id: string;
  name: string;
  tagline: string;
  askCash: number;
  askEquity: number;
  summary: string;
  facts: Record<string, string>;
  qa: [string, string][];
};

type Winner = {
  playerId: string;
  playerName: string;
  cash: number;
  equity: number;
  currentValue: number;
};

type GameState = {
  gameId: string;
  roomCode: string;
  status: "lobby" | "playing" | "finished";
  phase: "lobby" | "bidding" | "result" | "finished";
  currentIndex: number;
  totalCompanies: number;
  company: Company | null;
  players: Player[];
  winner: Winner | null;
  outcome: { value: number; note: string } | null;
  myPlayerId: string;
  isHost: boolean;
  myBid: { cash: number; equity: number } | null;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);

const pct = (value: number) => `${Number(value).toFixed(Number.isInteger(value) ? 0 : 1)}%`;

function readSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("shark-syndicate-session-v1");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session: { roomCode: string; playerToken: string }) {
  localStorage.setItem("shark-syndicate-session-v1", JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem("shark-syndicate-session-v1");
}

async function api<T>(
  url: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-player-token": token } : {}),
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Something went wrong.");
  }
  return payload as T;
}

export default function Home() {
  const [session, setSession] = useState<{ roomCode: string; playerToken: string } | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [bidCash, setBidCash] = useState("");
  const [bidEquity, setBidEquity] = useState("");

  useEffect(() => {
    const existing = readSession();
    if (existing) setSession(existing);
  }, []);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function refresh() {
      try {
        const next = await api<GameState>(
          `/api/games/${session!.roomCode}/state`,
          {},
          session!.playerToken
        );
        if (!cancelled) {
          setState(next);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to refresh.");
      } finally {
        if (!cancelled) timer = setTimeout(refresh, 1500);
      }
    }

    refresh();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [session]);

  useEffect(() => {
    if (state?.company && state.phase === "bidding" && !state.myBid) {
      setBidCash(String(state.company.askCash));
      setBidEquity(String(state.company.askEquity));
    }
  }, [state?.company?.id, state?.phase, state?.myBid]);

  const me = useMemo(
    () => state?.players.find((player) => player.id === state.myPlayerId),
    [state]
  );

  async function createGame(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ roomCode: string; playerToken: string }>("/api/games", {
        method: "POST",
        body: JSON.stringify({ displayName: name })
      });
      saveSession(result);
      setSession(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the game.");
    } finally {
      setBusy(false);
    }
  }

  async function joinGame(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ roomCode: string; playerToken: string }>(
        `/api/games/${roomCode.trim().toUpperCase()}/join`,
        {
          method: "POST",
          body: JSON.stringify({ displayName: name })
        }
      );
      saveSession(result);
      setSession(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join the game.");
    } finally {
      setBusy(false);
    }
  }

  async function action(path: string, body: Record<string, unknown> = {}) {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/games/${session.roomCode}/${path}`, {
        method: "POST",
        body: JSON.stringify(body)
      }, session.playerToken);
      const next = await api<GameState>(
        `/api/games/${session.roomCode}/state`,
        {},
        session.playerToken
      );
      setState(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  function leave() {
    clearSession();
    setSession(null);
    setState(null);
    setError("");
  }

  if (!session) {
    return (
      <main className="shell landing">
        <section className="hero">
          <div className="eyebrow">Multiplayer investment game</div>
          <h1>Shark Syndicate</h1>
          <p>
            Analyze real-style pitches, submit sealed offers, and build the most valuable
            venture portfolio.
          </p>
        </section>

        {error && <div className="notice bad">{error}</div>}

        <div className="home-grid">
          <form className="panel" onSubmit={createGame}>
            <div className="eyebrow">Host</div>
            <h2>Create a game</h2>
            <label>
              Your name
              <input
                required
                maxLength={30}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Zach"
              />
            </label>
            <button className="primary" disabled={busy}>
              {busy ? "Creating…" : "Create game"}
            </button>
          </form>

          <form className="panel" onSubmit={joinGame}>
            <div className="eyebrow">Player</div>
            <h2>Join a game</h2>
            <label>
              Your name
              <input
                required
                maxLength={30}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Sarah"
              />
            </label>
            <label>
              Room code
              <input
                required
                maxLength={6}
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                placeholder="ABC123"
              />
            </label>
            <button disabled={busy}>{busy ? "Joining…" : "Join room"}</button>
          </form>
        </div>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="shell">
        <div className="panel">
          <h2>Connecting to room {session.roomCode}…</h2>
          {error && (
            <>
              <div className="notice bad">{error}</div>
              <button onClick={leave}>Leave room</button>
            </>
          )}
        </div>
      </main>
    );
  }

  if (state.status === "lobby") {
    return (
      <main className="shell">
        <Header roomCode={state.roomCode} onLeave={leave} />
        {error && <div className="notice bad">{error}</div>}

        <section className="panel lobby-panel">
          <div>
            <div className="eyebrow">Shared lobby</div>
            <h1>Room {state.roomCode}</h1>
            <p>Send this code to the other players. Their names will appear here automatically.</p>
          </div>

          <div className="player-list">
            {state.players.map((player) => (
              <div className="player-row" key={player.id}>
                <div>
                  <strong>{player.displayName}</strong>
                  {player.isHost && <span className="tag">Host</span>}
                </div>
                <span className={player.ready ? "ready" : "muted"}>
                  {player.ready ? "Ready" : "Not ready"}
                </span>
              </div>
            ))}
          </div>

          <div className="button-row">
            <button
              className={me?.ready ? "" : "primary"}
              disabled={busy}
              onClick={() => action("ready", { ready: !me?.ready })}
            >
              {me?.ready ? "Mark not ready" : "I’m ready"}
            </button>

            {state.isHost && (
              <button
                className="primary"
                disabled={busy || state.players.length < 2 || !state.players.every((p) => p.ready)}
                onClick={() => action("start")}
              >
                Start game
              </button>
            )}
          </div>

          {state.isHost && state.players.length < 2 && (
            <small>At least two players must join.</small>
          )}
          {state.isHost && state.players.length >= 2 && !state.players.every((p) => p.ready) && (
            <small>Every player must mark ready before the host can start.</small>
          )}
        </section>
      </main>
    );
  }

  if (state.status === "finished" || state.phase === "finished") {
    const standings = [...state.players].sort(
      (a, b) => b.cash + b.portfolioValue - (a.cash + a.portfolioValue)
    );

    return (
      <main className="shell">
        <Header roomCode={state.roomCode} onLeave={leave} />
        <section className="hero compact">
          <div className="eyebrow">Final standings</div>
          <h1>{standings[0]?.displayName} wins</h1>
        </section>
        <section className="panel">
          <div className="standings">
            {standings.map((player, index) => (
              <div className="standing-row" key={player.id}>
                <span className="rank">#{index + 1}</span>
                <strong>{player.displayName}</strong>
                <span>Cash {money(player.cash)}</span>
                <span>Portfolio {money(player.portfolioValue)}</span>
                <strong>{money(player.cash + player.portfolioValue)}</strong>
              </div>
            ))}
          </div>
          {state.isHost && (
            <button className="primary" disabled={busy} onClick={() => action("restart")}>
              Play again
            </button>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <Header roomCode={state.roomCode} onLeave={leave} />
      {error && <div className="notice bad">{error}</div>}

      <div className="game-topline">
        <div>
          Company {state.currentIndex + 1} of {state.totalCompanies}
        </div>
        <div className="cash">Your cash: {money(me?.cash || 0)}</div>
      </div>

      <div className="game-grid">
        {state.company && <CompanyCard company={state.company} />}

        <section className="panel action-panel">
          {state.phase === "bidding" && (
            <>
              <div className="eyebrow">Sealed bidding</div>
              <h2>Make your offer</h2>
              <p>
                Other players can see that you submitted, but they cannot see your offer.
              </p>

              {state.myBid ? (
                <div className="notice good">
                  <strong>Bid submitted</strong>
                  <div>
                    {money(state.myBid.cash)} for {pct(state.myBid.equity)}
                  </div>
                </div>
              ) : (
                <>
                  <label>
                    Cash offered
                    <input
                      type="number"
                      min={0}
                      step={5000}
                      value={bidCash}
                      onChange={(event) => setBidCash(event.target.value)}
                    />
                  </label>
                  <label>
                    Equity requested
                    <input
                      type="number"
                      min={0.5}
                      max={100}
                      step={0.5}
                      value={bidEquity}
                      onChange={(event) => setBidEquity(event.target.value)}
                    />
                  </label>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() =>
                      action("bid", {
                        cash: Number(bidCash),
                        equity: Number(bidEquity)
                      })
                    }
                  >
                    Submit sealed bid
                  </button>
                  <button disabled={busy} onClick={() => action("pass")}>
                    I’m out
                  </button>
                </>
              )}

              <div className="divider" />
              <h3>Submission status</h3>
              <div className="submission-list">
                {state.players.map((player) => (
                  <div className="player-row" key={player.id}>
                    <strong>{player.displayName}</strong>
                    <span className={player.submitted ? "ready" : "muted"}>
                      {player.submitted ? "Decision locked" : "Considering"}
                    </span>
                  </div>
                ))}
              </div>

              {state.isHost && (
                <button
                  className="primary"
                  disabled={busy || !state.players.every((player) => player.submitted)}
                  onClick={() => action("resolve")}
                >
                  Reveal winner
                </button>
              )}
            </>
          )}

          {state.phase === "result" && (
            <>
              <div className="eyebrow">Round result</div>
              {state.winner ? (
                <>
                  <h2>{state.winner.playerName} wins the deal</h2>
                  <div className="winning-offer">
                    {money(state.winner.cash)} for {pct(state.winner.equity)}
                  </div>
                  <div className="notice good">
                    Stake value at the historical outcome:{" "}
                    <strong>{money(state.winner.currentValue)}</strong>
                  </div>
                </>
              ) : (
                <h2>No deal</h2>
              )}

              {state.outcome && (
                <div className="outcome">
                  <div className="eyebrow">Historical outcome</div>
                  <h3>Company value: {money(state.outcome.value)}</h3>
                  <p>{state.outcome.note}</p>
                </div>
              )}

              {state.isHost ? (
                <button className="primary" disabled={busy} onClick={() => action("next")}>
                  {state.currentIndex + 1 >= state.totalCompanies
                    ? "Show final standings"
                    : "Next company"}
                </button>
              ) : (
                <div className="notice">Waiting for the host to continue.</div>
              )}
            </>
          )}
        </section>
      </div>

      <section className="panel bankrolls">
        <h3>Public bankrolls</h3>
        <div className="bankroll-grid">
          {state.players.map((player) => (
            <div className="metric" key={player.id}>
              <span>{player.displayName}</span>
              <strong>{money(player.cash)}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Header({ roomCode, onLeave }: { roomCode: string; onLeave: () => void }) {
  return (
    <header className="topbar">
      <div className="brand">
        <strong>Shark Syndicate</strong>
        <span>Room {roomCode}</span>
      </div>
      <button className="ghost" onClick={onLeave}>
        Leave room
      </button>
    </header>
  );
}

function CompanyCard({ company }: { company: Company }) {
  return (
    <section className="panel company-card">
      <div className="eyebrow">Investment opportunity</div>
      <h1>{company.name}</h1>
      <p className="tagline">{company.tagline}</p>

      <div className="ask">
        <span>THE ASK</span>
        <strong>
          {money(company.askCash)} for {pct(company.askEquity)} equity
        </strong>
      </div>

      <p>{company.summary}</p>

      <div className="fact-grid">
        {Object.entries(company.facts).map(([label, value]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="divider" />
      <h3>Founder Q&amp;A</h3>
      <div className="qa-list">
        {company.qa.map(([question, answer]) => (
          <div className="qa" key={question}>
            <strong>{question}</strong>
            <span>{answer}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
