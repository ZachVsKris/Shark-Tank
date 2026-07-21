import { NextRequest } from "next/server";
import { findCompany } from "../../../../../lib/companies";
import { authenticatePlayer,bidEntityKey,dealDistance,impliedValue,jsonError,phaseCompanyIds } from "../../../../../lib/game";

export async function POST(request:NextRequest,context:{params:Promise<{roomCode:string}>}){try{
  const{roomCode}=await context.params;const{supabase,game,player}=await authenticatePlayer(roomCode,request);
  if(!player.is_host)throw new Error("Only the host can advance bidding.");
  if(!["round1","round2"].includes(game.phase))throw new Error("This phase cannot be resolved.");
  const ids=phaseCompanyIds(game);const round=game.phase==="round1"?1:2;
  const{data:bids,error}=await supabase.from("bids").select("*").eq("game_id",game.id).eq("phase_number",game.phase_number).eq("bidding_round",round);if(error)throw error;
  const{data:players}=await supabase.from("game_players").select("id,cash").eq("game_id",game.id);
  const{data:activeSyndicates}=await supabase.from("syndicates").select("id,leader_id").eq("game_id",game.id).eq("phase_number",game.phase_number).eq("status","active");
  const activeIds=(activeSyndicates||[]).map(s=>s.id);
  const{data:activeMembers}=activeIds.length?await supabase.from("syndicate_members").select("syndicate_id,player_id,response").in("syndicate_id",activeIds).eq("response","accepted"):{data:[] as any[]};
  const syndicatedPlayerIds=new Set((activeMembers||[]).map(m=>m.player_id));
  const expectedEntities=(players||[]).filter(p=>!syndicatedPlayerIds.has(p.id)).map(p=>`p:${p.id}`);
  for(const s of activeSyndicates||[])expectedEntities.push(`s:${s.id}`);
  if(round===1){for(let slot=0;slot<ids.length;slot++){const submitted=new Set((bids||[]).filter(b=>b.company_slot===slot).map(bidEntityKey));for(const entity of expectedEntities)if(!submitted.has(entity))throw new Error("Every independent player and active syndicate must submit or pass on every company.");}const{error:u}=await supabase.from("games").update({phase:"round2"}).eq("id",game.id);if(u)throw u;return Response.json({ok:true});}
  for(let slot=0;slot<ids.length;slot++){
    const company=findCompany(ids[slot]);if(!company)continue;
    const{data:r1}=await supabase.from("bids").select("*").eq("game_id",game.id).eq("phase_number",game.phase_number).eq("company_slot",slot).eq("bidding_round",1);
    const finalists=(r1||[]).filter(b=>!b.passed).sort((a,b)=>impliedValue(b)-impliedValue(a)||new Date(a.created_at).getTime()-new Date(b.created_at).getTime()).slice(0,2);
    const r2=(bids||[]).filter(b=>b.company_slot===slot);for(const f of finalists)if(!r2.some(b=>bidEntityKey(b)===bidEntityKey(f)))throw new Error("Every finalist must submit or pass in Round 2.");
    const round1ByEntity=new Map((r1||[]).map(b=>[bidEntityKey(b),b]));
    const valid=r2.filter(b=>!b.passed).map(b=>({...b,distance:dealDistance(Number(b.cash),Number(b.equity),company.actualDealCash,company.actualDealEquity),round1:round1ByEntity.get(bidEntityKey(b))})).sort((a,b)=>{
      const distanceDifference=a.distance-b.distance;
      if(Math.abs(distanceDifference)>1e-9)return distanceDifference;
      const aRound1=a.round1,bRound1=b.round1;
      const round1BidDifference=impliedValue(bRound1)-impliedValue(aRound1);
      if(Math.abs(round1BidDifference)>1e-9)return round1BidDifference;
      return new Date(aRound1.created_at).getTime()-new Date(bRound1.created_at).getTime();
    });if(!valid.length)continue;
    const winner=valid[0];
    if(winner.syndicate_id){
      const{data:members}=await supabase.from("syndicate_members").select("player_id,share").eq("syndicate_id",winner.syndicate_id).eq("response","accepted");
      for(const m of members||[]){const cashShare=Number(winner.cash)*Number(m.share)/100,equityShare=Number(winner.equity)*Number(m.share)/100;const p=(players||[]).find(x=>x.id===m.player_id);if(!p||cashShare>Number(p.cash))throw new Error("A syndicate member no longer has enough cash.");await supabase.from("game_players").update({cash:Number(p.cash)-cashShare}).eq("id",p.id);p.cash=Number(p.cash)-cashShare;const{error:ie}=await supabase.from("investments").insert({game_id:game.id,phase_number:game.phase_number,company_slot:slot,company_id:company.id,player_id:p.id,syndicate_id:winner.syndicate_id,cash_invested:cashShare,equity:equityShare,current_value:company.outcome.value*(equityShare/100),deal_distance:winner.distance});if(ie)throw ie;}
    }else{
      const p=(players||[]).find(x=>x.id===winner.player_id);if(!p||Number(winner.cash)>Number(p.cash))continue;await supabase.from("game_players").update({cash:Number(p.cash)-Number(winner.cash)}).eq("id",p.id);p.cash=Number(p.cash)-Number(winner.cash);const{error:ie}=await supabase.from("investments").insert({game_id:game.id,phase_number:game.phase_number,company_slot:slot,company_id:company.id,player_id:p.id,cash_invested:Number(winner.cash),equity:Number(winner.equity),current_value:company.outcome.value*(Number(winner.equity)/100),deal_distance:winner.distance});if(ie)throw ie;
    }
  }
  const{error:u}=await supabase.from("games").update({phase:"phase_result"}).eq("id",game.id);if(u)throw u;return Response.json({ok:true});
}catch(error){return jsonError(error);}}
