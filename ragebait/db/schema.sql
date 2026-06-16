-- Run this once against your Neon / Vercel Postgres database
-- e.g. via the Neon SQL editor, or `psql $DATABASE_URL -f db/schema.sql`
--
-- If you already ran the first version of this file (just the `users`
-- table), it's safe to run this whole file again — every statement uses
-- IF NOT EXISTS, so existing tables/columns are left alone and only the
-- new battle-related tables are added.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- USERS
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(32) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  aura          INTEGER NOT NULL DEFAULT 0,
  level         INTEGER NOT NULL DEFAULT 1,
  xp            INTEGER NOT NULL DEFAULT 0,
  wins          INTEGER NOT NULL DEFAULT 0,
  losses        INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak   INTEGER NOT NULL DEFAULT 0,
  bio           TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));

-- =========================================================
-- AURA TRANSACTIONS
-- Permanent log of every Aura change for a user.
-- =========================================================
CREATE TABLE IF NOT EXISTS aura_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  reason      TEXT NOT NULL,
  battle_id   UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aura_tx_user ON aura_transactions (user_id, created_at DESC);

-- =========================================================
-- BATTLES
-- =========================================================
CREATE TABLE IF NOT EXISTS battles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(140) NOT NULL,
  topic           VARCHAR(60) NOT NULL,
  battle_type     VARCHAR(20) NOT NULL DEFAULT 'casual', -- casual, ranked, friend, tournament, group, event
  mode            VARCHAR(20) NOT NULL DEFAULT 'text',    -- text, image, meme
  status          VARCHAR(20) NOT NULL DEFAULT 'open',    -- open, live, judging, completed, cancelled
  created_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opponent_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  rounds          INTEGER NOT NULL DEFAULT 3,             -- messages per participant before judging
  winner_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  ai_summary      TEXT,
  ai_scores       JSONB,                                  -- { [userId]: { humor, creativity, ... , total } }
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_battles_status ON battles (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_battles_creator ON battles (created_by);
CREATE INDEX IF NOT EXISTS idx_battles_opponent ON battles (opponent_id);

-- =========================================================
-- BATTLE MESSAGES
-- Each roast/message posted in a battle.
-- =========================================================
CREATE TABLE IF NOT EXISTS battle_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id   UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  round       INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_battle_messages_battle ON battle_messages (battle_id, created_at ASC);
