import pool from "../config/db.js";
import { QueryError } from "../utils/errors.js";

export interface PlaidAccountForUpsert {
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

export const BankAccountModel = {
  /**
   * Bulk upsert Plaid accounts. Uses a single SQL statement with unnest
   * for efficient batch insert/update instead of multiple round-trips.
   */
  bulkUpsertPlaidAccounts: async (accounts: PlaidAccountForUpsert[]) => {
    if (accounts.length === 0) {
      return [];
    }

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
        plaid_account_id, plaid_item_uuid, mask, name, official_name, type, subtype, current_balance, available_balance
      )
      SELECT
        unnest($1::text[]),
        unnest($2::uuid[]),
        unnest($3::text[]),
        unnest($4::text[]),
        unnest($5::text[]),
        unnest($6::text[]),
        unnest($7::text[]),
        unnest($8::numeric[]),
        unnest($9::numeric[])
      ON CONFLICT (plaid_account_id) DO UPDATE SET
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
};
