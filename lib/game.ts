import crypto from "crypto";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "./supabase-admin";
export const STARTING_CASH = 750000;
export function makeRoomCode(){const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";return Array.from({length:6},()=>a[Math.floor(Math.random()*a.length)]).join("");}
export function makePlayerToken(){return crypto.randomBytes(24).toString("hex");}
export function tokenHash(token:string){return crypto.createHash("sha256").update(token).digest("hex");}
export async function authenticatePlayer(roomCode:string,request:NextRequest){const token=request.headers.get("x-player-token")||"";if(!token)throw new Error("Missing player session.");const supabase=getSupabaseAdmin();const {data:game,error:ge}=await supabase.from("games").select("*").eq("room_code",roomCode.toUpperCase()).single();if(ge||!game)throw new Error("Game not found.");const {data:player,error:pe}=await supabase.from("game_players").select("*").eq("game_id",game.id).eq("token_hash",tokenHash(token)).single();if(pe||!player)throw new Error("This player session is no longer valid.");return{supabase,game,player};}
export function jsonError(error:unknown,status=400){return Response.json({error:error instanceof Error?error.message:"Unexpected error."},{status});}
export function phaseCompanyIds(game:any){const start=(game.phase_number-1)*game.companies_per_phase;return(game.company_ids||[]).slice(start,start+game.companies_per_phase);}
export function dealDistance(cash:number,equity:number,actualCash:number,actualEquity:number){return Math.abs(Math.log(Math.max(cash,1)/actualCash))+Math.abs(equity-actualEquity)/Math.max(actualEquity,1);}
