Subscriptions Manager MVP

## Problem
I often lose track of my online subscriptions and will sometimes forget that I even have them. This results in spending more than I want.
## Tech Stack
### Frontend
- React
	- Router
	- NextJS - Has a lot to offer out of the box including:
		- built-in API routes
		- routing and pages
		- server-side rendering (nice to have)
### Backend
- NodeJS
	- ExressJS

	### Server
- Supabase with postgreSQL
### APIs 
- Plaid

## User Stories
- As a user, I want to manage my subscriptions, so that I can be more efficient with my spendings
- As a user, I want to see all of my subscriptions, so that I can manage them better
- As a user, I want to connect my bank account so that I can see all my transactions in one place automatically
- As a user, I want to securely connect my bank account so that I don't have to manually enter transactions, 
- As a user, I want automatic detections for any updates to my recurring charges so that I am aware of any subscription updates.
- As a user, I want to be able to categorize each expenses so that I can see a breakdown of my monthly spending
- As a user, I want to see total spending per category

## MVP
Users connect their **US bank account via Plaid** and the app **automatically detects recurring subscriptions**, showing a **monthly cost breakdown** and **basic alerts**.
### Login / Signup
- [ ] Email/password (no OAuth for MVP)
- [ ] Session with JWT

###  Plaid connect (Link)
- [ ] Frontend can start Plaid Link (Link token provided by backend)
- [ ] User can connect an account and complete Link flow successfully
- Plaid MFA recovery code: E7EI2KBJHR3JYMB3M3BN3BLGZI
### Transaction ingestion
- [ ] Backend pulls transactions for connected accounts
- [ ] Transactions are stored in DB with stable IDs (no duplicates)
- [ ] Sync can be re-run idempotently (safe to retry)

###  Subscription detection (MVP logic)
- [ ] Group by `merchant_name` (or a stable merchant key)
- [ ] ~30 day interval
- [ ] At least 3 occurrences
- [ ] Produces a `Subscription` record per detected subscription

### Dashboard
- [ ] Monthly total subscription cost
- [ ] Subscription list (merchant + avg amount + frequency)
- [ ] Basic “next expected charge date” (best-effort)
- [ ] categorized subscriptions (optional: visual chart)

### Alerts (basic)
- [ ] Simple alert rule (e.g., “new subscription detected” or “price increased”)
- [ ] In-app notifications are acceptable for MVP (email optional)

# Day 1 - Project setup

## Database schema checklist (minimum)

### `User`
- [ ] `id (UUID, PK)` 
- [ ] `email: string` (unique, NOT NULL)
- [ ] `name: string | null` 
- [ ] `password_hash: string`
- [ ] `created_at: string`
- [ ] `updated_at: string`

### PlaidItem
- [ ] `id: UUID (Primary Key)`
- [ ] `userId (FK -> User.id)`
- [ ] `plaid_item_id: string (UNIQUE)`
- [ ] `encrypted_access_token: string`
- [ ] `institution_id`
- [ ] `institution_name` (for UI)
- [ ] `status`
- [ ] `created_at` 
- [ ] `updated_at`
- [ ] `cursor (NULLABLE)`

### BankAccount
- [ ] `id (UUID, PK)
- [ ] `plaid_account_id (UNIQUE)`
- [ ] `plaidItemId (FK -> PlaidItem.id, ON DELETE CASCADE)`
- [ ] `mask`
- [ ] `name`
- [ ] `official_name`
- [ ] `type`
- [ ] `subtype` (checking, savings, etc.)
- [ ] `current_balance (nullable) `
- [ ] `available_balance (nullable)`
- [ ] `is_active (default true)`
- [ ] `created_at` 
- [ ] `updated_at`

#### Transaction (INDEX bankAccountID and date)
- [ ] `id (UUID, OK)`
- [ ] `bankAccountID (FK -> BankAccount.id, On DELETE CASCADE)`
- [ ] `plaid_transaction_id (UNIQUE)`
- [ ] `date`
- [ ] `amount`
- [ ] `merchant_name`
- [ ] `name`
- [ ] `pending` (boolean)
- [ ] `removed_at (NULLABLE)`
- [ ] `created_at`
- [ ] `updated_at`
- [ ] `iso_currency_code`
- [ ] `category`

# Data Flow

## Auth Flow
- `POST /auth/signup`: create `User` , issue JWT (login right after signup). 
- `POST /auth/login`: verify `password_hash` , issue JWT.

## Plaid Item Flow
### 1. Create link_token to authenticate with Plaid Link:
1. `POST` `/plaid/create_link_token` (auth required): returns link_token.
2. Use `link_token` to open Link (UI module), which asks user for their bank credentials.
3. Link provides `public_token` via onSuccess callback.

### 2. Exchange public_token with Plaid Link exchange:
1. `POST /plaid/exchange_public_token`: exchange `public_token` for permanent `access_token`.
2. Encrypt token and insert/update PlaidItem (`plaid_item_id` UNIQUE).
3. Returns `{ itemId, plaid_item_id }`

### 3. Get account information
- `POST /plaid/items/:itemId/fetch-accounts` (auth required)
- Reads/decrypts PlaidItem access token.
- Calls Plaid accounts endpoint.
- Upserts BankAccount rows (plaid_account_id unique).
- Marks missing prior accounts as is_active = false.
- Returns `{ accountsLinked, accountsUpdated }.`
### 4. Transaction sync (shared worker/service):
- `POST /plaid/items/:itemId/sync-transactions` (auth required)
- Requires accounts already fetched.
- Uses PlaidItem.cursor and transactions sync.
- Read/decrypt access token; call Plaid transactions sync endpoint with stored cursor.
- For each added transaction: upsert Transaction by plaid_transaction_id.
- For each modified transaction: update mapped Transaction.
- For each removed transaction: set removed_at (soft-delete semantics).
- Persist new cursor on successful page completion.

### 5. Webhook-driven incremental sync
   - Plaid sends `POST /plaid/webhook` when item transactions update; 
   - backend fast-acks 200, dedupes enqueue by plaid_item_id, runs step 4 in background.  
==Why: Near-real-time updates instead of my backend constantly polling Plaid. Better performance.==
    
### 6. Subscription detection after sync  
- After successful sync, group transactions by:
	- normalized merchant key
	- detect recurring pattern (~30 days, >=3 hits)
	- upsert Subscription
	- create AlertEvent for new/price increase.  
Persisted derived data gives stable dashboard numbers and supports historical alerts.
    
### 7. Dashboard/read APIs
 - `GET /dashboard/summary`
 - `GET /subscriptions`
 - `GET /transactions`
 - Call all these to read from persisted tables.  
Fast responses, deterministic UX, and no expensive recalculation on every request.
    
###  8. Failure handling
- If Plaid token invalid, set PlaidItem.status = needs_reauth; do not advance cursor on failed sync; allow manual retry endpoint.  
Prevent data corruption and make operational recovery explicit.


> [!NOTE]
> cursor is Plaid’s checkpoint for transaction sync.
> - Think of it as “last processed position” for one PlaidItem.
> - On each sync call, you send Plaid the current cursor.
> - Plaid returns changes since that cursor (added, modified, removed) plus a next_cursor.
>  
>  “Advancing cursor” means saving that next_cursor to your DB after a successful sync batch.
>  
>  Why it matters:
>  1. No duplicates: next run starts where previous ended.
>  2. Incremental updates: you fetch only new changes, not full history.
>  3. Safe retries: if sync fails, keep old cursor and retry the same window.
>  