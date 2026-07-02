-- Dispute Case Management Database
-- Cloudflare D1 (SQLite) schema

CREATE TABLE IF NOT EXISTS dispute_case (
  id          TEXT PRIMARY KEY,
  user_id     TEXT,
  user_email  TEXT NOT NULL,
  user_full_name TEXT,
  stripe_dispute_id TEXT,
  stripe_charge_id  TEXT,
  reason      TEXT CHECK(reason IN ('fraud','not_received','duplicate','subscription_cancelled','other')) DEFAULT 'other',
  status      TEXT CHECK(status IN ('open','under_review','won','lost','withdrawn')) DEFAULT 'open',
  disputed_amount_usd REAL DEFAULT 0,
  currency    TEXT DEFAULT 'USD',
  response_due_date TEXT,
  notes       TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now')),
  created_by  TEXT
);

CREATE TABLE IF NOT EXISTS evidence_snapshot (
  id               TEXT PRIMARY KEY,
  dispute_case_id  TEXT NOT NULL REFERENCES dispute_case(id) ON DELETE CASCADE,
  snapshot_json    TEXT NOT NULL,
  generated_at     TEXT DEFAULT (datetime('now')),
  generated_by     TEXT
);

CREATE TABLE IF NOT EXISTS dispute_event (
  id               TEXT PRIMARY KEY,
  dispute_case_id  TEXT NOT NULL REFERENCES dispute_case(id) ON DELETE CASCADE,
  event_type       TEXT CHECK(event_type IN ('note','status_change','evidence_snapshot','seed_import','stripe_linked','account_deactivated')),
  content          TEXT,
  created_at       TEXT DEFAULT (datetime('now')),
  created_by       TEXT
);

-- Seeded historical login events (imported from past server logs)
CREATE TABLE IF NOT EXISTS seeded_login_event (
  id               TEXT PRIMARY KEY,
  dispute_case_id  TEXT NOT NULL REFERENCES dispute_case(id) ON DELETE CASCADE,
  user_id          TEXT,
  email_attempted  TEXT,
  ip_address       TEXT,
  user_agent       TEXT,
  success          INTEGER DEFAULT 0,
  created_at       TEXT  -- original historical timestamp
);
CREATE INDEX IF NOT EXISTS idx_seeded_login_case ON seeded_login_event(dispute_case_id);
CREATE INDEX IF NOT EXISTS idx_seeded_login_ts   ON seeded_login_event(created_at);

-- Seeded historical API requests
CREATE TABLE IF NOT EXISTS seeded_api_request (
  id               TEXT PRIMARY KEY,
  dispute_case_id  TEXT NOT NULL REFERENCES dispute_case(id) ON DELETE CASCADE,
  user_id          TEXT,
  api_key_prefix   TEXT,
  ip_address       TEXT,
  user_agent       TEXT,
  endpoint         TEXT,
  status_code      INTEGER,
  created_at       TEXT  -- original historical timestamp
);
CREATE INDEX IF NOT EXISTS idx_seeded_api_case ON seeded_api_request(dispute_case_id);
CREATE INDEX IF NOT EXISTS idx_seeded_api_ts   ON seeded_api_request(created_at);

-- Seeded historical LLM usage
CREATE TABLE IF NOT EXISTS seeded_llm_usage (
  id               TEXT PRIMARY KEY,
  dispute_case_id  TEXT NOT NULL REFERENCES dispute_case(id) ON DELETE CASCADE,
  user_id          TEXT,
  model_name       TEXT,
  source           TEXT,
  input_tokens     INTEGER DEFAULT 0,
  output_tokens    INTEGER DEFAULT 0,
  total_cost       REAL DEFAULT 0,
  created_at       TEXT  -- original historical timestamp
);
CREATE INDEX IF NOT EXISTS idx_seeded_llm_case ON seeded_llm_usage(dispute_case_id);
