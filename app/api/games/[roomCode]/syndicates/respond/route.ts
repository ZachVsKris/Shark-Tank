import { NextRequest } from "next/server";
import { authenticatePlayer, jsonError } from "../../../../../../lib/game";
export async function POST(request: NextRequest, context: { params: Promise<{ roomCode: string }> }) {
  try {
    const { roomCode } = await context.params; const body = await request.json();
    const { supabase, game, player } = await authenticatePlayer(roomCode, request);
    const response = body.accept ? "accepted" : "rejected";
    const { data: member } = await supabase.from("syndicate_members").select("id,syndicate_id").eq("syndicate_id", body.syndicateId).eq("player_id", player.id).single();
    if (!member) throw new Error("Invitation not found.");
    if(body.accept){
      const{data:activeSyndicates}=await supabase.from("syndicates").select("id").eq("game_id",game.id).eq("phase_number",game.phase_number).eq("status","active").neq("id",member.syndicate_id);
      const activeIds=(activeSyndicates||[]).map(s=>s.id);
      if(activeIds.length){const{data:existing}=await supabase.from("syndicate_members").select("id").in("syndicate_id",activeIds).eq("player_id",player.id).eq("response","accepted").maybeSingle();if(existing)throw new Error("You already belong to an active syndicate this phase.");}
    }
    await supabase.from("syndicate_members").update({ response }).eq("id", member.id);
    if (!body.accept) await supabase.from("syndicates").update({ status: "rejected" }).eq("id", member.syndicate_id);
    else {
      const { data: members } = await supabase.from("syndicate_members").select("player_id,response").eq("syndicate_id", member.syndicate_id);
      if ((members || []).every((m) => m.response === "accepted")) {
        const candidateIds=(members||[]).map(m=>m.player_id);
        const{data:otherActive}=await supabase.from("syndicates").select("id").eq("game_id",game.id).eq("phase_number",game.phase_number).eq("status","active").neq("id",member.syndicate_id);
        const otherIds=(otherActive||[]).map(s=>s.id);
        if(otherIds.length){const{data:conflicts}=await supabase.from("syndicate_members").select("player_id").in("syndicate_id",otherIds).in("player_id",candidateIds).eq("response","accepted");if((conflicts||[]).length)throw new Error("A member already belongs to another active syndicate this phase.");}
        await supabase.from("syndicates").update({ status: "active" }).eq("id", member.syndicate_id);
      }
    }
    return Response.json({ ok: true });
  } catch (error) { return jsonError(error); }
}
