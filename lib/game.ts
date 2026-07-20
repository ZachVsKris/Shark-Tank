import crypto from "crypto";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "./supabase-admin";

export const STARTING_CASH = 500000;

export function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function makePlayerToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function tokenHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function readToken(request: NextRequest) {
  return request.headers.get("x-player-token") || "";
}

export async function authenticatePlayer(roomCode: string, request: NextRequest) {
  const token = readToken(request);
  if (!token) throw new Error("Missing player session.");

  const supabase = getSupabaseAdmin();
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("room_code", roomCode.toUpperCase())
    .single();

  if (gameError || !game) throw new Error("Game not found.");

  const { data: player, error: playerError } = await supabase
    .from("game_players")
    .select("*")
    .eq("game_id", game.id)
    .eq("token_hash", tokenHash(token))
    .single();

  if (playerError || !player) throw new Error("This player session is no longer valid.");

  return { supabase, game, player };
}

export function jsonError(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return Response.json({ error: message }, { status });
}
