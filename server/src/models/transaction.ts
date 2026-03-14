import pool from "../config/db.js";
import { QueryError } from "../utils/errors.js";
import type { TransactionInsertDTO } from "../services/transaction/transaction.types.js";

export const TransactionModel = {

  bulkInsertPlaid: async (txns: TransactionInsertDTO[]) => {
    if (txns.length === 0) return 0;

    const bankAccountIds = txns.map(t => t.bankAccountId);
    const plaidIds = txns.map(t => t.plaidTransactionId);
    const sources = txns.map(t => t.source);
    const dates = txns.map(t => t.date);
    const amounts = txns.map(t => t.amount);
    const merchantNames = txns.map(t => t.merchantName);
    const names = txns.map(t => t.name);
    const pendings = txns.map(t => t.pending);
    const currencies = txns.map(t => t.isoCurrencyCode);
    const categories = txns.map(t => t.category);

    const sql = `
      INSERT INTO transactions (
        bank_account_id,
        plaid_transaction_id,
        source,
        date,
        amount,
        merchant_name,
        name,
        pending,
        iso_currency_code,
        category
      )
      SELECT
        unnest($1::uuid[]),
        unnest($2::text[]),
        unnest($3::transaction_source[]),
        unnest($4::date[]),
        unnest($5::numeric[]),
        unnest($6::text[]),
        unnest($7::text[]),
        unnest($8::boolean[]),
        unnest($9::text[]),
        unnest($10::text[])
      ON CONFLICT (plaid_transaction_id)
      DO NOTHING
    `;

    try {
      const result = await pool.query(sql, [
        bankAccountIds,
        plaidIds,
        sources,
        dates,
        amounts,
        merchantNames,
        names,
        pendings,
        currencies,
        categories
      ]);

      return result.rowCount; // inserted rows only
    } catch (error) {
      throw new QueryError("Failed to bulk insert Plaid transactions", {
        txnCount: txns.length,
        cause: error
      });
    }
  }

};