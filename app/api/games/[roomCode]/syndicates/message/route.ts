import { NextRequest } from "next/server";
import { authenticatePlayer, jsonError } from "../../../../../../lib/game";
export async function POST(request: NextRequest, context: { params: Promise<{ roomCode: string }> }) {
  try {
    const { roomCode } = await context.params; const body = await request.json();
    const { supabase, player } = await authenticatePlayer(roomCode, request);
    const text = String(body.body || "").trim().slice(0, 500); if (!text) throw new Error("Enter a message.");
    const { data: member } = await supabase.from("syndicate_members").select("id").eq("syndicate_id", body.syndicateId).eq("player_id", player.id).single();
    if (!member) throw new Error("You are not part of this syndicate.");
    const { error } = await supabase.from("syndicate_messages").insert({ syndicate_id: body.syndicateId, player_id: player.id, body: text }); if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) { return jsonError(error); }
}
