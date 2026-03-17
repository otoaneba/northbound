import { buildCsvRowHash } from "../csv.hash.js"
import { csvUtil } from "../csv.util.js"
import type { CsvAdapter } from "../csv.types.js"
import type { TransactionInsertDTO } from "../../transaction/transaction.types.js"

export class ChaseAdapter implements CsvAdapter {

  canHandle(headers: string[]): boolean {
    return headers.includes("Posting Date")
        && headers.includes("Amount")
        && headers.includes("Type")
  }

  mapRow(row: any, bankAccountId: string): TransactionInsertDTO {

    const amount = Number(row.Amount);
    const name = row.Description;
    const csvHash = buildCsvRowHash(bankAccountId, row["Posting Date"], amount, name);

    return {
      bankAccountId,
      source: "csv",   // now typed correctly
      plaidTransactionId: null,
      csvRowHash: csvHash,
      date: csvUtil.normalizeUsDate(row["Posting Date"]),
      amount,
      merchantName: csvUtil.cleanMerchant(row.Description),
      name: row.Description,
      pending: false,
      isoCurrencyCode: "USD",
      category: null
    }
  }
}
