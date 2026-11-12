-- Required for the secure reset flow and cross-instance login throttling.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash varchar(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS login_rate_limits (
  key varchar(64) PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  window_ends_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Needed to safely ignore duplicate Razorpay webhook deliveries.
CREATE UNIQUE INDEX IF NOT EXISTS payment_webhooks_event_id_unique
  ON payment_webhooks(event_id);
