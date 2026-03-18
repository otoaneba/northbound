import { buildCsvRowHash } from "../csv.hash.js"
import { csvUtil } from "../csv.util.js"
import type { CsvAdapter } from "../csv.types.js"
import type { TransactionInsertDTO } from "../../transaction/transaction.types.js"

export class BoaAdapter implements CsvAdapter {

  canHandle(headers: string[], sampleRows: any[]): boolean {
    if (headers.includes("Running Bal.")) {
      return true
    }
  
    const boaPatternDetected =
      sampleRows.some(r =>
        Object.keys(r).some(k =>
          k.includes("Running Bal")
        )
      )
  
    return boaPatternDetected
  }

  mapRow(row: any, bankAccountId: string): TransactionInsertDTO | null {

    if (!row.Date || !row.Description || !row.Amount) {
      return null
    }

    const amount =
      Number(String(row.Amount)
          .replace(/"/g, "")
          .replace(/,/g, "")
      )
    if (!Number.isFinite(amount)) return null

    // enforce invariant
    const name = row.Description;
    const csvHash = buildCsvRowHash(bankAccountId, row.Date, amount, name);
    const category = csvUtil.mapNameToCategory(name);

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
      category: category
    }
  }
}