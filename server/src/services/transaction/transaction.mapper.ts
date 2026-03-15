import type { Transaction as PlaidTxn } from "plaid"
import type { TransactionInsertDTO } from "./transaction.types.js"

export const TransactionMapper = {
  mapPlaidTxnToDTO: function(txn: PlaidTxn, bankAccountId: string): TransactionInsertDTO {
  
    const primaryCategory =
      txn.personal_finance_category?.primary ?? null
  
    return {
      bankAccountId,
      source: "plaid",
      plaidTransactionId: txn.transaction_id,
      csvRowHash: null,
      date: txn.date, // already yyyy-mm-dd
      amount: normalizePlaidAmount(txn.amount, primaryCategory),
      merchantName: txn.merchant_name ?? null,
      name: txn.merchant_name ?? "Unknown",
      pending: txn.pending ?? false,
      isoCurrencyCode:
        txn.iso_currency_code ??
        txn.unofficial_currency_code ??
        null,
      category: primaryCategory
    }
  }

}

function normalizePlaidAmount(amount: number, primaryCategory: string | null): number {

  if (!Number.isFinite(amount)) {
    throw new Error("Invalid Plaid transaction amount")
  }

  const abs = Math.abs(amount)

  const inflowCategories = [
    "INCOME",
    "TRANSFER_IN",
    "REFUND",
    "INTEREST"
  ]

  if (primaryCategory && inflowCategories.includes(primaryCategory)) {
    return Number(abs.toFixed(2))
  }

  // EVERYTHING ELSE is spending
  return Number((-abs).toFixed(2))
}

