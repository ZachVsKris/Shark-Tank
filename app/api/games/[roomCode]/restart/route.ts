import { NextRequest } from "next/server";
import { randomizedCompanyIds } from "../../../../../lib/companies";
import { authenticatePlayer, jsonError, STARTING_CASH } from "../../../../../lib/game";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await context.params;
    const { supabase, game, player } = await authenticatePlayer(roomCode, request);
    if (!player.is_host) throw new Error("Only the host can restart the game.");

    await supabase.from("bids").delete().eq("game_id", game.id);
    await supabase.from("investments").delete().eq("game_id", game.id);

    const { error: playersError } = await supabase
      .from("game_players")
      .update({ cash: STARTING_CASH, ready: false })
      .eq("game_id", game.id);

    if (playersError) throw playersError;

    const { error: gameError } = await supabase
      .from("games")
      .update({
        status: "lobby",
        phase: "lobby",
        current_index: 0,
        company_ids: randomizedCompanyIds(),
        round_winner_player_id: null,
        round_winner_cash: null,
        round_winner_equity: null,
        round_winner_value: null
      })
      .eq("id", game.id);

    if (gameError) throw gameError;
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
