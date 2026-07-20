import { NextRequest } from "next/server";
import { findCompany } from "../../../../../lib/companies";
import { authenticatePlayer, jsonError } from "../../../../../lib/game";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await context.params;
    const body = await request.json();
    const cash = Number(body.cash);
    const equity = Number(body.equity);

    const { supabase, game, player } = await authenticatePlayer(roomCode, request);
    if (game.status !== "playing" || game.phase !== "bidding") {
      throw new Error("Bidding is not open.");
    }

    const company = findCompany(game.company_ids?.[game.current_index]);
    if (!company) throw new Error("Company not found.");

    if (!Number.isFinite(cash) || cash <= 0) throw new Error("Enter a valid cash offer.");
    if (!Number.isFinite(equity) || equity <= 0 || equity > 100) {
      throw new Error("Enter a valid equity percentage.");
    }
    if (cash > Number(player.cash)) throw new Error("You do not have enough cash.");

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
      cash,
      equity,
      passed: false
    });

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
