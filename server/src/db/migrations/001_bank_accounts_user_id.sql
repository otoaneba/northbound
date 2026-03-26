-- Apply once on existing databases (schema.sql includes this for fresh installs).
ALTER TABLE bank_accounts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);

UPDATE bank_accounts ba
SET user_id = pi.user_id
FROM plaid_items pi
WHERE ba.plaid_item_uuid = pi.id
  AND ba.user_id IS NULL;
