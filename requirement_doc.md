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
- [ ] `subtype`
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

## Flow: Sign Up

Trigger:
User clicks "Sign up"

Frontend:
Calls POST /auth/signup

Backend route:
Creates User


Service Layer:



## Flow: Connect Bank  
  
Trigger:  
User clicks "Connect Bank"  
  
Frontend:  
Calls POST /plaid/create-link-token  
  
Backend Route:  
Creates link_token via Plaid API  
  
Service Layer:  
- Calls plaid.linkTokenCreate()  
- Returns link_token  
  
Database Changes:  
None  
  
Response:  
{ link_token }