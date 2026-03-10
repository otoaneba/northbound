import pool from "../config/db.js";
import { QueryError } from "../utils/errors.js";

interface CreatePlaidItemParams {
  userId: string;
  plaidItemId: string;
  encryptedAccessToken: string;
  institutionId: string | null;
  institutionName: string | null;
  status: string;
  cursor: string | null;
  environment: string;
}

export const PlaidItemModel = {
  create: async ({ userId, plaidItemId, encryptedAccessToken, institutionId, institutionName, status, cursor, environment }: CreatePlaidItemParams) => {
    let result;
    try {
      const sql = `
        INSERT INTO plaid_items
          (user_id, plaid_item_id, encrypted_access_token, environment, institution_id, institution_name, status, cursor)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, plaid_item_id
      `;
      result = await pool.query(sql, [userId, plaidItemId, encryptedAccessToken, environment, institutionId, institutionName, status, cursor]);
    } catch (error) {
      throw new QueryError("Failed to create PlaidItem", { userId, institutionName, cause: error });
    }
    if (!result.rows[0]) {
      throw new QueryError("Failed to create PlaidItem — no row returned");
    }
    return result.rows[0];
  },
};
