-- USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PLAID ITEMS
CREATE TABLE IF NOT EXISTS plaid_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plaid_item_id TEXT UNIQUE NOT NULL,
    encrypted_access_token TEXT NOT NULL,
    institution_id TEXT,
    institution_name TEXT,
    status TEXT,
    cursor TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BANK ACCOUNTS
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plaid_account_id TEXT UNIQUE NOT NULL,
    plaid_item_id UUID NOT NULL REFERENCES plaid_items(id) ON DELETE CASCADE,
    mask TEXT,
    name TEXT,
    official_name TEXT,
    type TEXT,
    subtype TEXT,
    current_balance NUMERIC,
    available_balance NUMERIC,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TRANSACTION SOURCE ENUM
DO $$ BEGIN
    CREATE TYPE transaction_source AS ENUM ('plaid', 'csv');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    plaid_transaction_id TEXT UNIQUE,               -- null for CSV rows
    csv_row_hash TEXT UNIQUE,                       -- SHA256(date+amount+name), null for Plaid rows
    source transaction_source NOT NULL,
    date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    merchant_name TEXT,
    name TEXT,
    pending BOOLEAN NOT NULL DEFAULT FALSE,
    iso_currency_code TEXT,
    category TEXT,
    removed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_bank_account_id ON transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_name TEXT NOT NULL,
    avg_amount NUMERIC NOT NULL,
    frequency_days INTEGER NOT NULL,      -- ~30
    last_charge_date DATE,
    next_expected_date DATE,
    occurrence_count INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active | cancelled | paused
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
