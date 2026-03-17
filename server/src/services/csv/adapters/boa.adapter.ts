import { buildCsvRowHash } from "../csv.hash.js"
import { csvUtil } from "../csv.util.js"
import type { CsvAdapter } from "../csv.types.js"
import type { TransactionInsertDTO } from "../../transaction/transaction.types.js"

export class BoaAdapter implements CsvAdapter {

  canHandle(headers: string[]): boolean {
    return headers.includes("Running Bal.")
  }

  mapRow(row: any, bankAccountId: string): TransactionInsertDTO | null {

    if (!row.Date || !row.Description || !row.Amount) {
      return null
    }

    const rawAmount =
      Number(
        String(row.Amount)
          .replace(/"/g, "")
          .replace(/,/g, "")
      )

    if (!Number.isFinite(rawAmount)) return null

    // enforce invariant
    const amount = rawAmount > 0 ? -Math.abs(rawAmount) : Math.abs(rawAmount);
    const name = row.Description;
    const csvHash = buildCsvRowHash(bankAccountId, row.Date, amount, name);

    return {
      bankAccountId,
      source: "csv",
      plaidTransactionId: null,
      csvRowHash: csvHash,
      date: csvUtil.normalizeUsDate(row.Date),
      amount,
      merchantName: csvUtil.cleanMerchant(row.Description),
      name: row.Description,
      pending: false,
      isoCurrencyCode: "USD",
      category: csvUtil.mapNameToCategory(row.Description)
    }
  }
}