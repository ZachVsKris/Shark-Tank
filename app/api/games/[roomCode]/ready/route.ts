import { NextRequest } from "next/server";
import { authenticatePlayer, jsonError } from "../../../../../lib/game";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await context.params;
    const body = await request.json();
    const { supabase, game, player } = await authenticatePlayer(roomCode, request);

    if (game.status !== "lobby") throw new Error("The game has already started.");

    const { error } = await supabase
      .from("game_players")
      .update({ ready: Boolean(body.ready) })
      .eq("id", player.id);

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
