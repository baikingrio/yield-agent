-- YieldAgent app state (JSON blob tables, mirrors server/db/schema.ts)

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS strategies (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS pacts (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS execution_logs (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS kv_blob (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS pact_credentials (
  pact_id TEXT PRIMARY KEY,
  api_key TEXT NOT NULL,
  stored_at TEXT NOT NULL
);

INSERT INTO meta (key, value)
VALUES ('schema_version', '1')
ON CONFLICT (key) DO NOTHING;
