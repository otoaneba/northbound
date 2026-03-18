import type { TransactionInsertDTO } from "../transaction/transaction.types.js"

export interface CsvAdapter {
  canHandle(headers: string[], sampleRows: any[]): boolean
  mapRow(row: any, bankAccountId: string): TransactionInsertDTO | null
}