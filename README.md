# Ragebait

> Win the roast. Claim the Aura.

An AI-powered competitive social platform for roast battles, debates, meme
wars, and community challenges. This is a Next.js + TypeScript + Tailwind app
with real authentication, real battles, and an AI Judge — backed by Postgres
(Neon) and OpenAI.

## What's included

- Landing page — shows real live/recent battles and the real leaderboard
- `/battles` — create a battle, list open/live/completed battles, join an
  opponent's open battle
- `/battles/[id]` — battle room: post roasts round by round, view AI verdict
  once judged
- `/leaderboard` — real rankings by Aura, computed from the `users` table
- `/profile` — your real account: Aura, level, XP, wins/losses, win rate,
  streaks, and a permanent Aura transaction history
- `/groups` — Rage Groups (communities) — still UI mockup/placeholder
- `/login`, `/signup` — working auth backed by Postgres (Neon) + JWT sessions
- AI Judge — when both players finish their rounds, either participant can
  trigger the AI Judge, which calls OpenAI to score the battle and updates
  Aura, wins/losses, and streaks for both players
- Shared UI kit: `Button`, `Card`, `AuraBadge`
- Dark, neon-purple / electric-blue / crimson theme via Tailwind tokens

## Setup (required)

### 1. Database (Postgres / Neon)

In your Vercel project dashboard:

1. Go to **Storage → Create Database → Postgres** (powered by Neon) and
   connect it to your project. This adds a connection string env var —
   commonly `DATABASE_URL` or `POSTGRES_URL` (the app checks both, plus
   `DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING` as fallbacks).

### 2. Run the schema

Run `db/schema.sql` against your database once (Neon SQL Editor, or
`psql "$DATABASE_URL" -f db/schema.sql`). It's safe to re-run — every
statement uses `IF NOT EXISTS`. This creates:

- `users` — accounts, Aura, level/XP, wins/losses, streaks
- `aura_transactions` — permanent log of every Aura change
- `battles` — battle metadata, status, AI scores/summary, winner
- `battle_messages` — each roast posted in a battle

### 3. JWT secret

**Vercel → Project Settings → Environment Variables** → add:

```
JWT_SECRET=<a long random string>
```

Generate one with `openssl rand -base64 32`.

### 4. OpenAI API key (required for the AI Judge)

The AI Judge calls OpenAI's API to score battles. Add:

```
OPENAI_API_KEY=<your OpenAI API key>
```

Get one from [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
Without this, battles can still be created and played, but the "Run AI Judge"
step will return an error explaining the key is missing.

### 5. Redeploy

After adding env vars, trigger a new deployment so the functions pick them up.

## How the battle flow works

1. A logged-in user clicks **+ Start a battle** on `/battles`, picks a title,
   topic, battle type, mode, and number of rounds per player. This creates a
   battle with status `open`.
2. Another logged-in user clicks **Join battle** on an open battle. Status
   becomes `live`, and both users can now post roasts in `/battles/[id]`.
3. Each player posts up to `rounds` messages. Once both have posted all their
   rounds, status becomes `judging`.
4. Either participant clicks **Run AI Judge**. This calls OpenAI with the
   full transcript, gets back scores (humor, creativity, originality, topic
   relevance, timing, comeback quality, confidence, wordplay, consistency),
   a winner, a summary, and feedback for each player.
5. The battle is marked `completed`. Aura is updated for both players
   (+25 for a win, +50 for a "dominant" win — margin ≥ 20 points — and -15
   for a loss), win/loss counts and streaks update, and an
   `aura_transactions` row is written for each change.

## How auth works

- `POST /api/auth/signup` — validates input (zod), checks for duplicate
  username/email, hashes the password (bcrypt), creates the user, sets a
  signed JWT session cookie.
- `POST /api/auth/login` — looks up user by username or email, verifies
  password, sets the session cookie. Returns `"Account not found."` or
  `"Please enter the correct password."` per the spec's error messages.
- `POST /api/auth/logout` — clears the session cookie.
- `GET /api/auth/me` — returns the current user from the session cookie, or
  `null`.
- Email OTP verification is **not yet implemented** — accounts are created
  as verified-by-default for now (see comments in `api/auth/login/route.ts`
  for where to enable the check once OTP exists).

## Not included yet (per the spec's roadmap)

Email OTP verification, Redis caching, Socket.IO real-time chat (battles
currently use polling while live), Cloudinary uploads, tournaments, seasons,
community vote (hybrid winner system), Rage Groups backend, admin dashboard,
analytics, achievements.

## Getting started locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll need a
`.env.local` with `DATABASE_URL`, `JWT_SECRET`, and `OPENAI_API_KEY` set
(copy from `.env.example`).

## Deploying to Vercel

### Option A — via GitHub (recommended)

1. Push this folder to a GitHub repository.
2. In Vercel, click **Add New → Project** and import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. Complete the setup steps above (database, schema, env vars), then deploy.

### Option B — via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel        # preview deploy
vercel --prod # production deploy
```

## Project structure

```
db/
  schema.sql        # Postgres schema (users, aura_transactions, battles, battle_messages)
src/
  app/
    api/
      auth/          # signup, login, logout, me
      aura/history/  # GET — current user's Aura transaction history
      battles/       # GET/POST list+create; [id], [id]/join, [id]/messages, [id]/judge
      leaderboard/   # GET — users ranked by Aura
    battles/
      page.tsx       # battle list + create
      [id]/page.tsx  # battle room
    groups/
    leaderboard/
    login/
    profile/         # real account data + Aura history
    signup/
    layout.tsx
    page.tsx
    globals.css
  components/
    auth/            # LoginForm, SignupForm
    battle/          # CreateBattleForm
    layout/          # Navbar (shows login state + Aura), Footer
    ui/              # Button, Card, AuraBadge
  lib/
    auth.ts          # JWT sign/verify + getSessionFromRequest
    db.ts            # Neon Postgres connection
    validation.ts    # zod schemas for signup/login
    hooks/
      useCurrentUser.ts
    mockData.ts      # Still used by /groups
  types/
    index.ts
```

## Next modules to build (suggested order)

1. Rage Groups backend (real communities, membership, group battles)
2. Community vote for the hybrid winner system (70% AI / 30% vote)
3. Email OTP verification for signup
4. Real-time chat (Socket.IO) + private/group messaging
5. Tournaments + seasons
6. Admin dashboard + analytics + achievements
 
