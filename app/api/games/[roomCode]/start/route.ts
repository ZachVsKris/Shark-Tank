import { NextRequest } from "next/server";
import { authenticatePlayer, jsonError } from "../../../../../lib/game";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await context.params;
    const { supabase, game, player } = await authenticatePlayer(roomCode, request);
    if (!player.is_host) throw new Error("Only the host can start the game.");
    if (game.status !== "lobby") throw new Error("The game has already started.");

    const { data: players, error } = await supabase
      .from("game_players")
      .select("ready")
      .eq("game_id", game.id);

    if (error) throw error;
    if ((players || []).length < 2) throw new Error("At least two players are required.");
    if (!(players || []).every((item) => item.ready)) {
      throw new Error("Every player must be ready.");
    }

    const { error: updateError } = await supabase
      .from("games")
      .update({
        status: "playing",
        phase: "bidding",
        current_index: 0,
        round_winner_player_id: null,
        round_winner_cash: null,
        round_winner_equity: null,
        round_winner_value: null
      })
      .eq("id", game.id);

    if (updateError) throw updateError;
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
