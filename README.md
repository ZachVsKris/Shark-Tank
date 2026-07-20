# Shark Syndicate v2

A synchronized multiplayer venture-investing strategy game built with Next.js, Supabase, and Vercel.

## Game format

- 2 players: 3 phases of 3 companies
- 3–4 players: 2 phases of 4 companies
- 5–6 players: 2 phases of 5 companies
- No timers; players and the host advance with Ready/Continue controls
- Every phase presents all companies at once
- Round 1 is sealed bidding
- The top two implied-valuation offers advance to Round 2
- Finalists learn only whether their first offer was higher or lower than the other finalist
- The final winner is the Round 2 offer closest to the company's historical accepted deal
- Phase results update cash, portfolio value, gain/loss, net worth, and the public leaderboard
- Intermissions let players use Phase 1 performance to inform Phase 2 alliances and strategy

## Install

1. Create a Supabase project
2. Run `supabase/schema.sql` in the Supabase SQL Editor. **The v2 schema resets prior game data.**
3. Add these Vercel environment variables:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

4. Deploy the repository to Vercel

## Local development

```bash
npm install
npm run dev
```

## Important scoring detail

Round 1 finalists are selected by implied valuation. Round 2 is scored by distance from the historical accepted cash/equity structure, so simply offering the highest valuation does not guarantee the deal.
