-- Shark Syndicate v2.1 schema. WARNING: resets existing game data.
create extension if not exists pgcrypto;
drop table if exists public.syndicate_messages cascade;
drop table if exists public.syndicate_members cascade;
drop table if exists public.syndicates cascade;
drop table if exists public.investments cascade;
drop table if exists public.bids cascade;
drop table if exists public.game_players cascade;
drop table if exists public.games cascade;

create table public.games (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  status text not null default 'lobby' check (status in ('lobby','playing','finished')),
  phase text not null default 'lobby' check (phase in ('lobby','round1','round2','phase_result','intermission','finished')),
  phase_number integer not null default 1,
  total_phases integer not null default 0,
  companies_per_phase integer not null default 0,
  company_ids jsonb not null default '[]'::jsonb,
  starting_cash numeric not null default 750000,
  created_at timestamptz not null default now()
);

create table public.game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  display_name text not null,
  token_hash text not null unique,
  cash numeric not null default 750000,
  ready boolean not null default false,
  is_host boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index game_players_unique_name on public.game_players (game_id, lower(display_name));

create table public.syndicates (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  phase_number integer not null,
  name text not null,
  leader_id uuid not null references public.game_players(id) on delete cascade,
  status text not null default 'proposed' check (status in ('proposed','active','rejected','cancelled')),
  created_at timestamptz not null default now()
);

create table public.syndicate_members (
  id uuid primary key default gen_random_uuid(),
  syndicate_id uuid not null references public.syndicates(id) on delete cascade,
  player_id uuid not null references public.game_players(id) on delete cascade,
  share numeric not null check (share > 0 and share <= 100),
  response text not null default 'pending' check (response in ('pending','accepted','rejected')),
  unique(syndicate_id, player_id)
);

create table public.syndicate_messages (
  id uuid primary key default gen_random_uuid(),
  syndicate_id uuid not null references public.syndicates(id) on delete cascade,
  player_id uuid not null references public.game_players(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  phase_number integer not null,
  company_slot integer not null,
  bidding_round integer not null check (bidding_round in (1,2)),
  player_id uuid references public.game_players(id) on delete cascade,
  syndicate_id uuid references public.syndicates(id) on delete cascade,
  cash numeric not null default 0,
  equity numeric not null default 0,
  passed boolean not null default false,
  created_at timestamptz not null default now(),
  check ((player_id is not null)::integer + (syndicate_id is not null)::integer = 1)
);
create unique index bids_player_unique on public.bids(game_id,phase_number,company_slot,bidding_round,player_id) where player_id is not null;
create unique index bids_syndicate_unique on public.bids(game_id,phase_number,company_slot,bidding_round,syndicate_id) where syndicate_id is not null;

create table public.investments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  phase_number integer not null,
  company_slot integer not null,
  company_id text not null,
  player_id uuid not null references public.game_players(id) on delete cascade,
  syndicate_id uuid references public.syndicates(id) on delete set null,
  cash_invested numeric not null,
  equity numeric not null,
  current_value numeric not null,
  deal_distance numeric not null,
  created_at timestamptz not null default now(),
  unique(game_id,phase_number,company_slot,player_id)
);

alter table public.games enable row level security;
alter table public.game_players enable row level security;
alter table public.syndicates enable row level security;
alter table public.syndicate_members enable row level security;
alter table public.syndicate_messages enable row level security;
alter table public.bids enable row level security;
alter table public.investments enable row level security;
