import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "../../../lib/supabase-admin";
import { randomizedCompanyIds } from "../../../lib/companies";
import {
  jsonError,
  makePlayerToken,
  makeRoomCode,
  STARTING_CASH,
  tokenHash
} from "../../../lib/game";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const displayName = String(body.displayName || "").trim().slice(0, 30);
    if (!displayName) throw new Error("Enter your name.");

    const supabase = getSupabaseAdmin();

    let roomCode = "";
    let game = null;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      roomCode = makeRoomCode();
      const { data, error } = await supabase
        .from("games")
        .insert({
          room_code: roomCode,
          status: "lobby",
          phase: "lobby",
          current_index: 0,
          company_ids: randomizedCompanyIds(),
          starting_cash: STARTING_CASH
        })
        .select()
        .single();

      if (!error && data) {
        game = data;
        break;
      }
      if (error?.code !== "23505") throw error;
    }

    if (!game) throw new Error("Could not generate a room code.");

    const playerToken = makePlayerToken();
    const { error: playerError } = await supabase.from("game_players").insert({
      game_id: game.id,
      display_name: displayName,
      token_hash: tokenHash(playerToken),
      cash: STARTING_CASH,
      ready: false,
      is_host: true
    });

    if (playerError) throw playerError;

    return Response.json({ roomCode, playerToken });
  } catch (error) {
    return jsonError(error);
  }
}
