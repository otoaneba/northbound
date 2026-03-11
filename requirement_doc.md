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
- As a user, I want to upload a CSV export from my bank so that I can use the app without connecting my bank account directly

## MVP
Users connect their **US bank account via Plaid** and the app **automatically detects recurring subscriptions**, showing a **monthly cost breakdown** and **basic alerts**.

##################################################################
> !NOTE **Change of Plan — Sandbox Only**
> - After evaluating costs, the Production Plaid plan is too expensive for personal use. This build will use Plaid Sandbox only, meaning:
> - No real bank connections — test credentials and synthetic data only
> - CSV upload (see section below) is the primary path for personal use
> - The full Plaid Production flow documented above is preserved for reference, in case this is developed for real users in the future
> - Bypass Link via /sandbox/public_token/create during development; test webhooks via /sandbox/item/fire_webhook
##################################################################

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

### CSV Upload (alternative to Plaid)
- [ ] User can upload a CSV file exported from their bank
- [ ] Backend parses and validates required columns (`date`, `amount`, `merchant_name` / `name`)
- [ ] Parsed rows are normalized and upserted as Transactions (keyed by `date + amount + name` to avoid duplicates on re-upload)
- [ ] Triggers the same subscription detection pipeline as Plaid sync
- [ ] Clear error feedback for malformed files or missing columns

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
- [ ] `plaid_transaction_id (UNIQUE, NULLABLE)` — null for CSV-imported rows
- [ ] `csv_row_hash (UNIQUE, NULLABLE)` — SHA of `date + amount + name` for CSV dedup; null for Plaid rows
- [ ] `source (enum: 'plaid' | 'csv')`
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
    
## CSV Upload Flow
### 1. Upload and parse
- `POST /csv/upload` (auth required, `multipart/form-data`)
- Backend receives file, parses CSV (e.g., with `papaparse` or `csv-parse`).
- Validates required columns: `date`, `amount`, `name` (and optionally `merchant_name`, `category`).
- Returns validation error with row details if columns are missing or values are unparseable.

### 2. Normalize and upsert
- Map CSV columns to Transaction shape (normalize date to ISO, amount to positive float).
- Compute `csv_row_hash = SHA256(date + amount + name)` per row.
- Upsert Transactions by `csv_row_hash` — safe to re-upload the same file.
- Set `source = 'csv'`, `plaid_transaction_id = null`, `pending = false`.
- Associate rows with a synthetic BankAccount for CSV imports (one per user, created on first upload).

### 3. Trigger detection
- After upsert, run the same subscription detection pipeline (step 6 of Plaid flow).

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


# Public APIs / Interfaces / Types

1. POST /auth/signup
    - Request: { email, password, name? }
    - Response: { userId, token }
2. POST /auth/login
    - Request: { email, password }
    - Response: { token }
3. POST /plaid/create-link-token
    - Response: { link_token }
4. POST /plaid/exchange-public-token
    - Request: { public_token, institution? }
    - Response: { itemId, accountsLinked }
5. POST /plaid/webhook
    - Request: Plaid webhook payload
    - Response: 200 fast-ack
6. POST /sync/plaid-item/:id (internal/admin/manual retry)
    - Response: { synced, added, modified, removed }
7. POST /csv/upload
    - Request: multipart/form-data with `file` field (CSV)
    - Response: { imported, skipped, errors: [{ row, message }] }
8. GET /subscriptions
    - Response item: { id, merchant, avgAmount, frequency, lastChargeDate, nextExpectedDate, status }
9. GET /dashboard/summary
    - Response: { month, totalSubscriptionCost, activeSubscriptions, newSinceLastMonth, priceIncreases }

# Plaid API Endpoints (Production and Sandbox)

## Production
### Required (core flow)

| Endpoint                    | Purpose                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------- |
| /link/token/create          | Create a link token for the Plaid Link UI so users can connect their bank           |
| /item/public_token/exchange | Exchange the public token from Link (UI module) for an access_token (then store it) |
| /transactions/sync          | Fetch and sync transactions (cursor-based, incremental) for subscription detection  |

---
### Bank Accounts

| Endpoint              | Purpose                                                              |
| --------------------- | -------------------------------------------------------------------- |
| /accounts/balance/get | Get account balances and metadata (name, mask, type)                 |
| /item/get             | Get item status and institution_id (e.g. for re-auth, status checks) |

---

### Optional for MVP

| Endpoint                | Purpose                                                                        |
| ----------------------- | ------------------------------------------------------------------------------ |
| /institutions/get_by_id | Get institution name/logo for display                                          |
| /auth/get               | Only if you need routing/account numbers (e.g. ACH)                            |
| Webhooks                | Receive events like TRANSACTIONS_ADDED, ITEM_LOGIN_REQUIRED instead of polling |

### Sandbox

| Endpoint                     | Purpose                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| /sandbox/public_token/create | Bypass Link UI — generate a public_token directly via API for dev/testing                |
| /sandbox/item/fire_webhook   | Manually trigger webhooks (e.g., TRANSACTIONS_ADDED) since they don't fire automatically |
| /sandbox/item/reset_login    | Force an Item into ITEM_LOGIN_REQUIRED to test your failure handling (step 8)            |

---

### Summary


# Auth Strategy
## Architecture
- use middleware for authentication and authorization
- /plaid /sync, subscriptions/, and dashboard/ routes all protected with middleware
- both long in and signup returns JWT. Don't use middleware as these routes hand over the JWT token
- app -> **middleware (if needed)** -> controller -> service -> model

## Login / Sing up 
### controller 
- keep thin.
- Propagate error to error handler.
- Request validation ?

### Service
- Business logic AND validation
- provide JWT token
- throws:
	- AlreadyExistsError
	- ValidationError
	- AuthenticationError

### Model
- Keep thin
- Only handle SQL 
- throws:
	- QueryError

# Error Handling Strategy
## Flow
Model throws
   v
service throws (does not catch nor handle model error)
   v
controller does not throw (catches but does not handle)
   v
errorHandler handles and returns 
## Classes 
- AppError extends Error
	- takes in (message, statusCode, details ={} )
	- sub classes:
		- NotFoundError (thrown by service)
		- QueryError (thrown by Model)
		- ValidationError (thrown by service)
		- AuthenticationError (thrown by middleware)
		- ForbiddenError (thrown by service)
		- AlreadyExistsError (thrown by service)


# DB 
## Local (Dev)
- Docker + PostgreSQL for local development and testing
- Schema auto-initialized via `docker-entrypoint-initdb.d/schema.sql` on first `docker compose up`

## Production (MVP)
- **Render** to host both the Node/Express backend and PostgreSQL database
- Use Render's managed PostgreSQL service (replaces previous Supabase plan)
- `DATABASE_URL` env var swapped out for Render's connection string on deploy
##### Commands to use

``` python
docker compose up -d # start in background

docker compose down # stop

docker compose down -v # stop + wipe data

docker compose logs db # view postgres logs

```


# Backend Folder Architecture
```
src/
	app.js
	server.js
	config/
		db.js
		env.js
	middleware/
		auth.js
		errorHandler.js
	routes/
		auth.js
		plaid.js
		csv.js
		subscriptions.js
		dashboard.js
	models/
		user.js,
		plaidItem.js
		bankAccount.js
		transaction.js
		subscription.js
	services/
		auth.js
		plaid.js
		csv.js
		subscriptionDetection.js
	controllers/
		auth.js
		plaid.js
		csv.js
		subscriptions.js
		dashboard.js
	utils/
		errors.js
	tests/
		services/
		controllers/
		utils/
```


# Day 6 - Auth + Postman Testing

## Goals
- Verify auth flow end-to-end (signup → login → protected route)
- Confirm DB rows are created correctly
- Confirm error handling works as expected

## Pre-flight checklist
- [ ] Docker is running (`docker compose ps`)
- [ ] `npm run dev` starts without errors
- [ ] pgAdmin connected to `northbound` DB

## Postman Test Plan

### 1. POST /auth/signup — happy path
- **Body:** `{ "email": "test@example.com", "password": "password123", "name": "Test User" }`
- **Expect:** `201` with `{ token, user: { id, email, name } }`
- **Verify in pgAdmin:** row exists in `users` table with hashed password

### 2. POST /auth/signup — duplicate email
- Same body as above
- **Expect:** `400` with `{ error: "Email already registered" }`

### 3. POST /auth/signup — validation errors
- Missing password: `{ "email": "test@example.com" }` → `400`
- Short password: `{ "email": "test@example.com", "password": "abc" }` → `400`
- Bad email: `{ "email": "notanemail", "password": "password123" }` → `400`

### 4. POST /auth/login — happy path
- **Body:** `{ "email": "test@example.com", "password": "password123" }`
- **Expect:** `200` with `{ token, user: { id, email, name } }`
- **Save the token** for the next test

### 5. POST /auth/login — wrong password
- **Body:** `{ "email": "test@example.com", "password": "wrongpassword" }`
- **Expect:** `401` with `{ error: "Invalid email or password" }`

### 6. POST /auth/login — non-existent email
- **Body:** `{ "email": "nobody@example.com", "password": "password123" }`
- **Expect:** `401` with `{ error: "Invalid email or password" }`

### 7. Protected route — valid token
- Add header: `Authorization: Bearer <token from step 4>`
- Hit any protected route (can use `GET /` as a placeholder)
- **Expect:** not a `401`

### 8. Protected route — missing/invalid token
- No `Authorization` header
- **Expect:** `401` with `{ error: "Token is invalid." }`

---

# Core UI Screens

1. **Dashboard**
	1. categorized transactions in a chart
	2. total balance and total spent (per month)
	3. list of transactions
2. **Subscriptions**
3. **Profile**
4. **Login/Signup**
5. **Menu**
	1. Side menu that can be minimized
	2. includes clickable pages:
		1. Profile
		2. Dashboard
		3. Subscriptions