import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabase-admin";
import {
  jsonError,
  makePlayerToken,
  STARTING_CASH,
  tokenHash
} from "../../../../../lib/game";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await context.params;
    const body = await request.json();
    const displayName = String(body.displayName || "").trim().slice(0, 30);
    if (!displayName) throw new Error("Enter your name.");

    const supabase = getSupabaseAdmin();
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("room_code", roomCode.toUpperCase())
      .single();

    if (gameError || !game) throw new Error("Room not found.");
    if (game.status !== "lobby") throw new Error("This game has already started.");

    const { count } = await supabase
      .from("game_players")
      .select("*", { count: "exact", head: true })
      .eq("game_id", game.id);

    if ((count || 0) >= 6) throw new Error("This room is full.");

    const { data: sameName } = await supabase
      .from("game_players")
      .select("id")
      .eq("game_id", game.id)
      .ilike("display_name", displayName)
      .maybeSingle();

    if (sameName) throw new Error("That name is already being used in this room.");

    const playerToken = makePlayerToken();
    const { error: playerError } = await supabase.from("game_players").insert({
      game_id: game.id,
      display_name: displayName,
      token_hash: tokenHash(playerToken),
      cash: STARTING_CASH,
      ready: false,
      is_host: false
    });

    if (playerError) throw playerError;

    return Response.json({
      roomCode: roomCode.toUpperCase(),
      playerToken
    });
  } catch (error) {
    return jsonError(error);
  }
}
