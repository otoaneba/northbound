import { buildCsvRowHash } from "../csv.hash.js"
import { csvUtil } from "../csv.util.js"
import type { CsvAdapter } from "../csv.types.js"
import type { TransactionInsertDTO } from "../../transaction/transaction.types.js"

export class CapitalOneAdapter implements CsvAdapter {

  canHandle(headers: string[]): boolean {
    return headers.includes("Transaction Description")
        && headers.includes("Transaction Type")
  }

  mapRow(row: any, bankAccountId: string): TransactionInsertDTO | null {

    if (!row["Transaction Date"]) return null

    const rawAmount = Number(row["Transaction Amount"])
    if (!Number.isFinite(rawAmount)) return null

    const amount = row["Transaction Type"] === "Debit" ? -Math.abs(rawAmount) : Math.abs(rawAmount);
    const name = row["Transaction Description"];
    const csvHash = buildCsvRowHash(bankAccountId, row["Transaction Date"], amount, name);

    return {
      bankAccountId,
      source: "csv",
      plaidTransactionId: null,
      csvRowHash: csvHash,
      date: csvUtil.normalizeUsShortDate(row["Transaction Date"]),
      amount,
      merchantName: csvUtil.cleanMerchant(row["Transaction Description"]),
      name: name,
      pending: false,
      isoCurrencyCode: "USD",
      category: csvUtil.mapNameToCategory(row["Transaction Description"])
    }
  }
}