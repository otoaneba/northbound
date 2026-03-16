import { csvUtil } from "../csv.util.js"
import type { CsvAdapter } from "../csv.types.js"
import type { TransactionInsertDTO } from "../../transaction/transaction.types.js"
import { buildCsvRowHash } from "../csv.hash.js"

export class AppleAdapter implements CsvAdapter {

  canHandle(headers: string[]): boolean {
    return headers.includes("Merchant") && headers.includes("Transaction Date")
  }

  mapRow(row: any, bankAccountId: string): TransactionInsertDTO | null {

    const rawAmount = Number(row["Amount (USD)"])
    if (!Number.isFinite(rawAmount)) return null

    const amount = rawAmount > 0 ? Math.abs(rawAmount) : -Math.abs(rawAmount);
    const name = row.Description ?? row.Merchant;
    const csvHash = buildCsvRowHash(bankAccountId, row["Transaction Date"], amount, name)

    return {
      bankAccountId,
      source: "csv",
      plaidTransactionId: null,
      csvRowHash: csvHash,
      date: csvUtil.normalizeUsDate(row["Transaction Date"]),
      amount,
      merchantName: row.Merchant ?? csvUtil.cleanMerchant(row.Description),
      name: name,
      pending: false,
      isoCurrencyCode: "USD",
      category: row.Category ?? null
    }
  }
}