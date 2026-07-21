import { NextRequest } from "next/server";
import { authenticatePlayer, jsonError } from "../../../../../../lib/game";

export async function POST(request: NextRequest, context: { params: Promise<{ roomCode: string }> }) {
  try {
    const { roomCode } = await context.params;
    const body = await request.json();
    const { supabase, game, player } = await authenticatePlayer(roomCode, request);
    if (!["round1", "round2", "intermission"].includes(game.phase)) throw new Error("Syndicates cannot be proposed right now.");
    const ids = Array.from(new Set([player.id, ...(Array.isArray(body.memberIds) ? body.memberIds : [])]));
    if (ids.length < 2) throw new Error("Choose at least one partner.");
    const { data: validPlayers } = await supabase.from("game_players").select("id,display_name").eq("game_id", game.id).in("id", ids);
    if ((validPlayers || []).length !== ids.length) throw new Error("One or more selected players are invalid.");
    const { data: activeSyndicates } = await supabase.from("syndicates").select("id").eq("game_id",game.id).eq("phase_number",game.phase_number).eq("status","active");
    const activeIds=(activeSyndicates||[]).map(s=>s.id);
    if(activeIds.length){const{data:activeMembers}=await supabase.from("syndicate_members").select("player_id").in("syndicate_id",activeIds).eq("response","accepted");const occupied=new Set((activeMembers||[]).map(m=>m.player_id));if(ids.some(id=>occupied.has(id)))throw new Error("A selected player already belongs to an active syndicate this phase.");}
    const share = 100 / ids.length;
    const name = String(body.name || `${player.display_name}'s Syndicate`).trim().slice(0, 40);
    const { data: syndicate, error } = await supabase.from("syndicates").insert({ game_id: game.id, phase_number: game.phase_number, name, leader_id: player.id }).select().single();
    if (error) throw error;
    const rows = ids.map((id) => ({ syndicate_id: syndicate.id, player_id: id, share, response: id === player.id ? "accepted" : "pending" }));
    const { error: memberError } = await supabase.from("syndicate_members").insert(rows);
    if (memberError) throw memberError;
    return Response.json({ ok: true });
  } catch (error) { return jsonError(error); }
}
