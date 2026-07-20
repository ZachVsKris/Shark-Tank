import { NextRequest } from "next/server";
import { authenticatePlayer, jsonError } from "../../../../../lib/game";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await context.params;
    const { supabase, game, player } = await authenticatePlayer(roomCode, request);
    if (!player.is_host) throw new Error("Only the host can continue.");
    if (game.phase !== "result") throw new Error("The current round is not finished.");

    const isLast = game.current_index + 1 >= (game.company_ids?.length || 0);

    const { error } = await supabase
      .from("games")
      .update(
        isLast
          ? {
              status: "finished",
              phase: "finished"
            }
          : {
              current_index: game.current_index + 1,
              phase: "bidding",
              round_winner_player_id: null,
              round_winner_cash: null,
              round_winner_equity: null,
              round_winner_value: null
            }
      )
      .eq("id", game.id);

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
