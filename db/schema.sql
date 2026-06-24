-- Ragebait database schema — safe to re-run (all IF NOT EXISTS)
-- Run against your Neon / Vercel Postgres database
-- e.g. via the Neon SQL editor, or: psql $DATABASE_URL -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- USERS
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username       VARCHAR(32) UNIQUE NOT NULL,
  email          VARCHAR(255) UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  date_of_birth  DATE,
  display_name   VARCHAR(50),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  aura           INTEGER NOT NULL DEFAULT 0,
  level          INTEGER NOT NULL DEFAULT 1,
  xp             INTEGER NOT NULL DEFAULT 0,
  wins           INTEGER NOT NULL DEFAULT 0,
  losses         INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak    INTEGER NOT NULL DEFAULT 0,
  bio            TEXT NOT NULL DEFAULT '',
  avatar_url     TEXT,
  banner_url     TEXT,
  is_admin       BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned      BOOLEAN NOT NULL DEFAULT FALSE,
  banned_reason  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_username  ON users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_email     ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_aura      ON users (aura DESC);

-- Add missing columns to existing users table (safe if already exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name  VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url    TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin      BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE users ALTER COLUMN avatar_url DROP NOT NULL;

-- =========================================================
-- AURA TRANSACTIONS  — permanent ledger, never delete
-- =========================================================
CREATE TABLE IF NOT EXISTS aura_transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  reason     TEXT NOT NULL,
  category   VARCHAR(30) NOT NULL DEFAULT 'general',
  battle_id  UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aura_tx_user   ON aura_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aura_tx_battle ON aura_transactions (battle_id);

ALTER TABLE aura_transactions ADD COLUMN IF NOT EXISTS category VARCHAR(30) NOT NULL DEFAULT 'general';

-- =========================================================
-- BATTLES
-- =========================================================
CREATE TABLE IF NOT EXISTS battles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                VARCHAR(140) NOT NULL,
  topic                VARCHAR(60) NOT NULL,
  battle_type          VARCHAR(20) NOT NULL DEFAULT 'casual',
  mode                 VARCHAR(20) NOT NULL DEFAULT 'text',
  status               VARCHAR(20) NOT NULL DEFAULT 'open',
  created_by           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opponent_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  group_id             UUID,
  rounds               INTEGER NOT NULL DEFAULT 3,
  current_round        INTEGER NOT NULL DEFAULT 0,
  winner_id            UUID REFERENCES users(id) ON DELETE SET NULL,
  ai_summary           TEXT,
  ai_winner_reasoning  TEXT,
  ai_scores            JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at           TIMESTAMPTZ,
  completed_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_battles_status   ON battles (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_battles_creator  ON battles (created_by);
CREATE INDEX IF NOT EXISTS idx_battles_opponent ON battles (opponent_id);
CREATE INDEX IF NOT EXISTS idx_battles_topic    ON battles (topic);

ALTER TABLE battles ADD COLUMN IF NOT EXISTS current_round       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS ai_winner_reasoning TEXT;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS group_id            UUID;

-- =========================================================
-- BATTLE MESSAGES
-- =========================================================
CREATE TABLE IF NOT EXISTS battle_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id   UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  round       INTEGER NOT NULL DEFAULT 1,
  aura_change INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_battle_messages_battle ON battle_messages (battle_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_battle_messages_user   ON battle_messages (user_id);

ALTER TABLE battle_messages ADD COLUMN IF NOT EXISTS aura_change INTEGER;

-- =========================================================
-- RAGE GROUPS
-- =========================================================
CREATE TABLE IF NOT EXISTS rage_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(60) UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT,
  banner_url  TEXT,
  topics      JSONB NOT NULL DEFAULT '[]',
  is_private  BOOLEAN NOT NULL DEFAULT FALSE,
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groups_name ON rage_groups (LOWER(name));

ALTER TABLE rage_groups ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE rage_groups ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE rage_groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- =========================================================
-- GROUP MEMBERS
-- =========================================================
CREATE TABLE IF NOT EXISTS group_members (
  group_id   UUID NOT NULL REFERENCES rage_groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(20) NOT NULL DEFAULT 'member',
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members (user_id);

-- =========================================================
-- FOLLOWS
-- =========================================================
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower  ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows (following_id);

-- =========================================================
-- BLOCKS
-- =========================================================
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- =========================================================
-- REPORTS
-- =========================================================
CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL,  -- 'user', 'battle', 'message', 'group'
  target_id   UUID NOT NULL,
  reason      VARCHAR(50) NOT NULL,
  description TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, reviewed, actioned, dismissed
  reviewed_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at DESC);

-- =========================================================
-- ACHIEVEMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         VARCHAR(50) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon        VARCHAR(10) NOT NULL DEFAULT '🎖️',
  category    VARCHAR(30) NOT NULL DEFAULT 'battle',
  aura_reward INTEGER NOT NULL DEFAULT 0,
  is_hidden   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

-- =========================================================
-- SEED ACHIEVEMENTS
-- =========================================================
INSERT INTO achievement_definitions (key, name, description, icon, category, aura_reward) VALUES
  ('first_battle',    'Battle Born',      'Complete your first battle.',              '⚔️',  'battle',  10),
  ('first_win',       'First Blood',      'Win your first battle.',                   '🩸',  'battle',  25),
  ('win_5',           'On a Roll',        'Win 5 battles.',                           '🔥',  'battle',  50),
  ('win_25',          'Battle Veteran',   'Win 25 battles.',                          '🏅',  'battle',  100),
  ('win_100',         'Battle King',      'Win 100 battles.',                         '👑',  'battle',  500),
  ('streak_3',        'On Fire',          'Win 3 battles in a row.',                  '🔥',  'streak',  30),
  ('streak_10',       'Unstoppable',      'Win 10 battles in a row.',                 '⚡',  'streak',  100),
  ('aura_100',        'Aura Rising',      'Reach 100 Aura.',                          '💜',  'aura',    10),
  ('aura_1000',       'Aura Lord',        'Reach 1,000 Aura.',                        '💎',  'aura',    50),
  ('aura_10000',      'Aura God',         'Reach 10,000 Aura.',                       '⭐',  'aura',    200),
  ('group_create',    'Community Builder','Create your first Rage Group.',            '🏗️', 'social',  20),
  ('first_group_join','Group Member',     'Join your first Rage Group.',              '👥',  'social',  5),
  ('top_10',          'Top 10',           'Reach the top 10 on the leaderboard.',     '🏆',  'ranking', 100),
  ('top_1',           'The GOAT',         'Reach #1 on the global leaderboard.',      '🐐',  'ranking', 500)
ON CONFLICT (key) DO NOTHING;
