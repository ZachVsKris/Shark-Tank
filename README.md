# Shark Syndicate v2.1

A 2–6 player multiplayer venture-investing game built with Next.js, Supabase, and Vercel.

## Gameplay

- 2 players: 3 phases with 3 companies per phase
- 3–4 players: 2 phases with 4 companies per phase
- 5–6 players: 2 phases with 5 companies per phase
- Every company in a phase is visible at once
- Round 1 sealed bidding followed by a top-two runoff
- Finalists learn only whether their first offer was higher or lower
- Winning offers are selected by proximity to the historical accepted deal
- Fixed historical company outcomes determine portfolio values
- Phase standings reveal cash, invested capital, portfolio value, and net worth
- No timers; players and the host control progression

## Syndicates

Players can privately:

- propose multi-player syndicates during bidding or intermission
- accept or reject invitations
- exchange private messages
- bid as an active syndicate
- split cash contributions, ownership, and outcome value equally

Only the syndicate leader submits its bid. Individual players may still make their own bids.

## Deployment

1. Run `supabase/schema.sql` in the Supabase SQL Editor. **This resets existing game data.**
2. Add these Vercel environment variables:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

3. Upload the project contents to the root of the GitHub repository connected to Vercel.
4. Commit and push. Vercel should deploy automatically.

## Local verification

```bash
npm install
npm run build
npm run dev
```

The production build was successfully verified before packaging.

## Test Build 1 safeguards

- Use a separate Supabase project. The included schema resets all game data.
- A player may belong to only one active syndicate in a phase.
- Active syndicate members no longer submit separate individual decisions; the syndicate leader submits for the group.
- Restarting a game clears bids, investments, syndicates, members, and private messages.
- The interface is visibly labeled as an experimental test build.


## Test Build 2 changes

- Added a searchable in-game rules modal available from the landing page, lobby, and active game
- Added explicit tie-break logic: closest Round 2 offer, then higher Round 1 bid, then earliest Round 1 submission
- Added a deal breakdown showing finalists, both-round offers, match scores, and the tie-breaker used
- Updated the visible experimental-build label to Test Build 2
