import { NextRequest } from "next/server";
import { findCompany } from "../../../../../lib/companies";
import { authenticatePlayer, jsonError } from "../../../../../lib/game";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await context.params;
    const { supabase, game, player } = await authenticatePlayer(roomCode, request);

    const { data: players, error: playerError } = await supabase
      .from("game_players")
      .select("id, display_name, cash, ready, is_host")
      .eq("game_id", game.id)
      .order("created_at");

    if (playerError) throw playerError;

    const currentCompanyId = game.company_ids?.[game.current_index] || null;
    const company = findCompany(currentCompanyId);

    const { data: roundBids } = await supabase
      .from("bids")
      .select("player_id, cash, equity, passed")
      .eq("game_id", game.id)
      .eq("company_index", game.current_index);

    const submittedIds = new Set((roundBids || []).map((bid) => bid.player_id));
    const myRawBid = (roundBids || []).find((bid) => bid.player_id === player.id);

    const { data: investments } = await supabase
      .from("investments")
      .select("player_id, current_value")
      .eq("game_id", game.id);

    const portfolioByPlayer = new Map<string, number>();
    for (const investment of investments || []) {
      portfolioByPlayer.set(
        investment.player_id,
        (portfolioByPlayer.get(investment.player_id) || 0) + Number(investment.current_value)
      );
    }

    let winner = null;
    if (game.phase === "result" && game.round_winner_player_id) {
      const winnerPlayer = players?.find((item) => item.id === game.round_winner_player_id);
      winner = {
        playerId: game.round_winner_player_id,
        playerName: winnerPlayer?.display_name || "Winner",
        cash: Number(game.round_winner_cash),
        equity: Number(game.round_winner_equity),
        currentValue: Number(game.round_winner_value)
      };
    }

    return Response.json({
      gameId: game.id,
      roomCode: game.room_code,
      status: game.status,
      phase: game.phase,
      currentIndex: game.current_index,
      totalCompanies: game.company_ids?.length || 0,
      company: company
        ? {
            id: company.id,
            name: company.name,
            tagline: company.tagline,
            askCash: company.askCash,
            askEquity: company.askEquity,
            summary: company.summary,
            facts: company.facts,
            qa: company.qa
          }
        : null,
      players: (players || []).map((item) => ({
        id: item.id,
        displayName: item.display_name,
        cash: Number(item.cash),
        ready: item.ready,
        isHost: item.is_host,
        submitted: submittedIds.has(item.id),
        portfolioValue: portfolioByPlayer.get(item.id) || 0
      })),
      winner,
      outcome:
        game.phase === "result" && company
          ? { value: company.outcome.value, note: company.outcome.note }
          : null,
      myPlayerId: player.id,
      isHost: player.is_host,
      myBid:
        myRawBid && !myRawBid.passed
          ? { cash: Number(myRawBid.cash), equity: Number(myRawBid.equity) }
          : myRawBid
            ? { cash: 0, equity: 0 }
            : null
    });
  } catch (error) {
    return jsonError(error, 401);
  }
}
