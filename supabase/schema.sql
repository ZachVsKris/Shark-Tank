-- Run this entire file once in Supabase:
-- Dashboard → SQL Editor → New query → Paste → Run

create extension if not exists pgcrypto;

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  phase text not null default 'lobby' check (phase in ('lobby', 'bidding', 'result', 'finished')),
  current_index integer not null default 0,
  company_ids jsonb not null default '[]'::jsonb,
  starting_cash numeric not null default 500000,
  round_winner_player_id uuid,
  round_winner_cash numeric,
  round_winner_equity numeric,
  round_winner_value numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  display_name text not null,
  token_hash text not null unique,
  cash numeric not null default 500000,
  ready boolean not null default false,
  is_host boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists game_players_unique_name
  on public.game_players (game_id, lower(display_name));

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  company_index integer not null,
  player_id uuid not null references public.game_players(id) on delete cascade,
  cash numeric not null default 0,
  equity numeric not null default 0,
  passed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (game_id, company_index, player_id)
);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  company_index integer not null,
  company_id text not null,
  player_id uuid not null references public.game_players(id) on delete cascade,
  cash_invested numeric not null,
  equity numeric not null,
  current_value numeric not null,
  created_at timestamptz not null default now()
);

alter table public.games enable row level security;
alter table public.game_players enable row level security;
alter table public.bids enable row level security;
alter table public.investments enable row level security;

-- No public policies are intentionally created.
-- The browser never talks directly to these tables.
-- All reads/writes go through Next.js server routes using the service-role key.
