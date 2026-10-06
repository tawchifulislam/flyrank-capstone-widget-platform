ALTER TABLE submissions ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_idempotency
  ON submissions (widget_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;