CREATE TABLE IF NOT EXISTS widgets (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('signup', 'contact', 'cta')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  button_text TEXT NOT NULL DEFAULT 'Submit',
  fields JSONB NOT NULL DEFAULT '[]',
  display_options JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_widgets_owner ON widgets (owner_id);

CREATE TABLE IF NOT EXISTS submissions (
  id BIGSERIAL PRIMARY KEY,
  widget_id TEXT NOT NULL REFERENCES widgets (id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL,
  data JSONB NOT NULL,
  ip TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_widget_created ON submissions (widget_id, created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_owner ON submissions (owner_id);