import { NextRequest } from "next/server";
import { findCompany } from "../../../../../lib/companies";
import { authenticatePlayer, jsonError } from "../../../../../lib/game";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await context.params;
    const { supabase, game, player } = await authenticatePlayer(roomCode, request);
    if (!player.is_host) throw new Error("Only the host can reveal the winner.");
    if (game.status !== "playing" || game.phase !== "bidding") {
      throw new Error("This round is not accepting bids.");
    }

    const company = findCompany(game.company_ids?.[game.current_index]);
    if (!company) throw new Error("Company not found.");

    const { data: players, error: playersError } = await supabase
      .from("game_players")
      .select("id, cash")
      .eq("game_id", game.id);

    if (playersError) throw playersError;

    const { data: bids, error: bidsError } = await supabase
      .from("bids")
      .select("*")
      .eq("game_id", game.id)
      .eq("company_index", game.current_index);

    if (bidsError) throw bidsError;
    if ((bids || []).length !== (players || []).length) {
      throw new Error("Every player must submit a decision.");
    }

    const valid = (bids || [])
      .filter((bid) => {
        if (bid.passed) return false;
        const cash = Number(bid.cash);
        const equity = Number(bid.equity);
        const playerCash = Number(players?.find((item) => item.id === bid.player_id)?.cash || 0);
        return (
          cash >= company.askCash &&
          cash <= playerCash &&
          equity > 0 &&
          equity <= company.founderMaxEquity
        );
      })
      .map((bid) => ({
        ...bid,
        score: Number(bid.cash) / (Number(bid.equity) / 100)
      }))
      .sort((a, b) => b.score - a.score || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (!valid.length) {
      const { error } = await supabase
        .from("games")
        .update({
          phase: "result",
          round_winner_player_id: null,
          round_winner_cash: null,
          round_winner_equity: null,
          round_winner_value: null
        })
        .eq("id", game.id);

      if (error) throw error;
      return Response.json({ ok: true, winner: null });
    }

    const winner = valid[0];
    const cash = Number(winner.cash);
    const equity = Number(winner.equity);
    const currentValue = company.outcome.value * (equity / 100);
    const winnerPlayer = players?.find((item) => item.id === winner.player_id);
    if (!winnerPlayer) throw new Error("Winning player not found.");

    const { error: cashError } = await supabase
      .from("game_players")
      .update({ cash: Number(winnerPlayer.cash) - cash })
      .eq("id", winner.player_id);

    if (cashError) throw cashError;

    const { error: investmentError } = await supabase.from("investments").insert({
      game_id: game.id,
      company_index: game.current_index,
      company_id: company.id,
      player_id: winner.player_id,
      cash_invested: cash,
      equity,
      current_value: currentValue
    });

    if (investmentError) throw investmentError;

    const { error: gameError } = await supabase
      .from("games")
      .update({
        phase: "result",
        round_winner_player_id: winner.player_id,
        round_winner_cash: cash,
        round_winner_equity: equity,
        round_winner_value: currentValue
      })
      .eq("id", game.id);

    if (gameError) throw gameError;
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
