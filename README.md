# Shark Syndicate — Multiplayer Next.js MVP

A real multiplayer version of the investment game. Players can join the same room from separate computers, see synchronized game state, and submit private sealed bids.

## Current features

- Create a room with a six-character code
- Join from separate computers or phones
- Shared ready lobby
- Host-controlled game start
- Six sample company pitches
- Prominent `THE ASK`
- Shared company and Q&A information
- Private sealed bids stored server-side
- Public submission status without revealing bid terms
- Server-side bid validation and winner calculation
- Synchronized winner and company-outcome reveal
- Public remaining bankrolls
- Final portfolio standings
- Replay in the same room

This first multiplayer build intentionally does **not** include syndicates yet. The room, synchronization, sealed bidding, and scoring foundation should be tested first.

## 1. Create the Supabase database

1. Create a Supabase project
2. Open **SQL Editor**
3. Open `supabase/schema.sql` from this repository
4. Paste the entire file into a new query
5. Click **Run**

## 2. Find the Supabase credentials

In Supabase, open:

**Project Settings → API**

Copy:

- Project URL
- `service_role` key

Do not commit the service-role key to GitHub.

## 3. Add Vercel environment variables

In Vercel:

**Project → Settings → Environment Variables**

Add:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Add both variables to Production, Preview, and Development.

`NEXT_PUBLIC_APP_URL` is optional in this version.

After adding variables, redeploy the latest deployment.

## 4. Upload to GitHub

Upload the **contents** of this folder to the root of the GitHub repository connected to Vercel.

The repository root should contain:

```text
app/
lib/
supabase/
package.json
tsconfig.json
README.md
```

Do not upload the outer `shark-syndicate-nextjs` folder as a nested directory unless that nested directory is configured as Vercel's Root Directory.

## 5. Deploy

Vercel should detect Next.js automatically.

The first build runs:

```bash
npm install
npm run build
```

Once deployment finishes:

1. Open the Vercel URL in one browser
2. Create a room
3. Open the same URL on another computer or in an incognito browser
4. Join using the room code
5. Mark both players ready
6. Start the game

## How private bids work

The browser receives only:

- whether each player submitted
- the current player's own bid
- the winner after resolution

It never receives other players' bid amounts. The Supabase service-role key exists only in server-side Route Handlers.

## Current founder acceptance rule

A bid is valid when:

- cash is at least the founder's original ask
- the player has enough remaining cash
- requested equity does not exceed the company's historical acceptance boundary

Among valid offers, the founder selects the highest implied valuation:

```text
cash offered ÷ equity percentage
```

An exact tie is broken by whichever bid reached the server first. This is temporary until the dedicated runoff system is added.

## Next build

After this version works across computers:

1. Top-two runoff bidding
2. Secret syndicate proposals
3. Counteroffers and approvals
4. Multi-player syndicates
5. Research-backed Shark Tank company dataset
6. Reconnection and host-transfer controls
