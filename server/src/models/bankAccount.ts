import pool from "../config/db.js";
import { QueryError } from "../utils/errors.js";

export interface PlaidAccountForUpsert {
  userId: string;
  plaidAccountId: string;
  plaidItemId: string;
  mask: string | null;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
}

/** Manual / CSV-only bank account (no Plaid link). */
export interface ManualBankAccountInsert {
  userId: string;
  name: string;
  mask: string | null;
  type: string | null;
  subtype: string | null;
  officialName: string | null;
}

export interface BankAccountListRow {
  id: string;
  name: string | null;
  mask: string | null;
  type: string | null;
  subtype: string | null;
  official_name: string | null;
  plaid_item_uuid: string | null;
  created_at: Date;
}

export const BankAccountModel = {
  /**
   * Bulk upsert Plaid accounts. Uses a single SQL statement with unnest
   * for efficient batch insert/update instead of multiple round-trips.
   */
  bulkUpsertPlaidAccounts: async (accounts: PlaidAccountForUpsert[]) => {
    if (accounts.length === 0) {
      return [];
    }

    const userIds = accounts.map((a) => a.userId);
    const plaidAccountIds = accounts.map((a) => a.plaidAccountId);
    const plaidItemIds = accounts.map((a) => a.plaidItemId);
    const masks = accounts.map((a) => a.mask);
    const names = accounts.map((a) => a.name);
    const officialNames = accounts.map((a) => a.officialName);
    const types = accounts.map((a) => a.type);
    const subtypes = accounts.map((a) => a.subtype);
    const currentBalances = accounts.map((a) => a.currentBalance);
    const availableBalances = accounts.map((a) => a.availableBalance);

    const sql = `
      INSERT INTO bank_accounts (
        user_id, plaid_account_id, plaid_item_uuid, mask, name, official_name, type, subtype, current_balance, available_balance
      )
      SELECT
        unnest($1::uuid[]),
        unnest($2::text[]),
        unnest($3::uuid[]),
        unnest($4::text[]),
        unnest($5::text[]),
        unnest($6::text[]),
        unnest($7::text[]),
        unnest($8::text[]),
        unnest($9::numeric[]),
        unnest($10::numeric[])
      ON CONFLICT (plaid_account_id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        plaid_item_uuid = EXCLUDED.plaid_item_uuid,
        mask = EXCLUDED.mask,
        name = EXCLUDED.name,
        official_name = EXCLUDED.official_name,
        type = EXCLUDED.type,
        subtype = EXCLUDED.subtype,
        current_balance = EXCLUDED.current_balance,
        available_balance = EXCLUDED.available_balance,
        updated_at = NOW()
      RETURNING id, plaid_account_id, name
    `;

    try {
      const result = await pool.query(sql, [
        userIds,
        plaidAccountIds,
        plaidItemIds,
        masks,
        names,
        officialNames,
        types,
        subtypes,
        currentBalances,
        availableBalances,
      ]);
      return result.rows;
    } catch (error) {
      throw new QueryError("Failed to bulk upsert Plaid accounts", {
        accountCount: accounts.length,
        cause: error,
      });
    }
  },

  findByPlaidItemId: async (plaidItemId: string) => {
    const sql = `
      SELECT
        id,
        plaid_account_id
      FROM bank_accounts
      WHERE plaid_item_uuid = $1
    `;
  
    try {
      const result = await pool.query(sql, [plaidItemId]);
      return result.rows;
    } catch (error) {
      throw new QueryError("Failed to fetch bank accounts by Plaid item", {
        plaidItemId,
        cause: error,
      });
    }
  },

  /**
   * Insert a bank account for CSV/manual use (no Plaid ids).
   */
  createManualForUser: async (input: ManualBankAccountInsert): Promise<BankAccountListRow> => {
    const sql = `
      INSERT INTO bank_accounts (
        user_id,
        name,
        mask,
        type,
        subtype,
        official_name
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        name,
        mask,
        type,
        subtype,
        official_name,
        plaid_item_uuid,
        created_at
    `;

    try {
      const result = await pool.query(sql, [
        input.userId,
        input.name,
        input.mask,
        input.type,
        input.subtype,
        input.officialName,
      ]);
      return result.rows[0] as BankAccountListRow;
    } catch (error) {
      throw new QueryError("Failed to create bank account", {
        userId: input.userId,
        cause: error,
      });
    }
  },

  /**
   * Accounts visible to this user: owned via user_id or via Plaid item ownership.
   * Matches the visibility rules used when listing transactions.
   */
  findAccessibleByUserId: async (userId: string): Promise<BankAccountListRow[]> => {
    const sql = `
      SELECT
        ba.id,
        ba.name,
        ba.mask,
        ba.type,
        ba.subtype,
        ba.official_name,
        ba.plaid_item_uuid,
        ba.created_at
      FROM bank_accounts ba
      WHERE ba.is_active = TRUE
        AND (
          ba.user_id = $1::uuid
          OR EXISTS (
            SELECT 1 FROM plaid_items pi
            WHERE pi.id = ba.plaid_item_uuid AND pi.user_id = $1::uuid
          )
        )
      ORDER BY ba.name ASC NULLS LAST, ba.created_at DESC
    `;

    try {
      const result = await pool.query(sql, [userId]);
      return result.rows as BankAccountListRow[];
    } catch (error) {
      throw new QueryError("Failed to list bank accounts for user", {
        userId,
        cause: error,
      });
    }
  },
};
