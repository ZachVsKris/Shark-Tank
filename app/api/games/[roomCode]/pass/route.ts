import { NextRequest } from "next/server";
import { authenticatePlayer, jsonError } from "../../../../../lib/game";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await context.params;
    const { supabase, game, player } = await authenticatePlayer(roomCode, request);
    if (game.status !== "playing" || game.phase !== "bidding") {
      throw new Error("Bidding is not open.");
    }

    const { data: existing } = await supabase
      .from("bids")
      .select("id")
      .eq("game_id", game.id)
      .eq("company_index", game.current_index)
      .eq("player_id", player.id)
      .maybeSingle();

    if (existing) throw new Error("Your decision is already locked.");

    const { error } = await supabase.from("bids").insert({
      game_id: game.id,
      company_index: game.current_index,
      player_id: player.id,
      cash: 0,
      equity: 0,
      passed: true
    });

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
