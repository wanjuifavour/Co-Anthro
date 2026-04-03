-- Co-Anthro table schema
-- Xata uses the schema designer / REST API, but this DDL documents the app's data model.
-- The Xata warning about LIMIT/WHERE is for row-returning SELECT queries; it does not apply to CREATE TABLE statements.

CREATE TABLE
IF NOT EXISTS ideas
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  problem_statement TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS tasks
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  task_key TEXT NOT NULL UNIQUE,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  checked_by TEXT NOT NULL DEFAULT 'team',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS documents
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL DEFAULT 'team',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS notes
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
()
);

CREATE TABLE
IF NOT EXISTS settings
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT ''
);
