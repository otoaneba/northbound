import pool from "../config/db.js";
import { QueryError } from "../utils/errors.js";
import type { TransactionInsertDTO } from "../services/transaction/transaction.types.js";

export interface TransactionListRow {
  id: string;
  bank_account_id: string;
  bank_account_name: string | null;
  source: string;
  date: string;
  amount: string;
  merchant_name: string | null;
  name: string | null;
  pending: boolean;
  iso_currency_code: string | null;
  category: string | null;
  created_at: Date;
}

export interface FindTransactionsForUserParams {
  userId: string;
  startDate: string | null;
  endDate: string | null;
  bankAccountId: string | null;
  source: "plaid" | "csv" | null;
  limit: number;
}

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
  }, 

  bulkInsertCsv: async (txns: TransactionInsertDTO[]) => {
    if (txns.length === 0) return 0;
  
    const bankAccountIds = txns.map(t => t.bankAccountId);
    const hashes = txns.map(t => t.csvRowHash);
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
        csv_row_hash,
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
      ON CONFLICT (csv_row_hash)
      DO NOTHING
    `;
  
    try {
      const result = await pool.query(sql, [
        bankAccountIds,
        hashes,
        sources,
        dates,
        amounts,
        merchantNames,
        names,
        pendings,
        currencies,
        categories
      ]);
  
      return result.rowCount;
    } catch (error) {
      throw new QueryError("Failed to bulk insert CSV transactions", {
        txnCount: txns.length,
        cause: error
      });
    }
  },

  findForUser: async (params: FindTransactionsForUserParams): Promise<TransactionListRow[]> => {
    const sql = `
      SELECT
        t.id,
        t.bank_account_id,
        ba.name AS bank_account_name,
        t.source::text AS source,
        t.date::text AS date,
        t.amount::text AS amount,
        t.merchant_name,
        t.name,
        t.pending,
        t.iso_currency_code,
        t.category,
        t.created_at
      FROM transactions t
      INNER JOIN bank_accounts ba ON ba.id = t.bank_account_id
      WHERE t.removed_at IS NULL
        AND (
          ba.user_id = $1::uuid
          OR EXISTS (
            SELECT 1 FROM plaid_items pi
            WHERE pi.id = ba.plaid_item_uuid AND pi.user_id = $1::uuid
          )
        )
        AND ($2::date IS NULL OR t.date >= $2::date)
        AND ($3::date IS NULL OR t.date <= $3::date)
        AND ($4::uuid IS NULL OR t.bank_account_id = $4::uuid)
        AND ($5::text IS NULL OR t.source::text = $5)
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT $6
    `;

    try {
      const result = await pool.query(sql, [
        params.userId,
        params.startDate,
        params.endDate,
        params.bankAccountId,
        params.source,
        params.limit,
      ]);
      return result.rows as TransactionListRow[];
    } catch (error) {
      throw new QueryError("Failed to list transactions for user", {
        userId: params.userId,
        cause: error,
      });
    }
  },
};