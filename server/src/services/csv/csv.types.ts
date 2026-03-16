import type { TransactionInsertDTO } from "../transaction/transaction.types.js"

export interface CsvAdapter {
  canHandle(headers: string[]): boolean
  mapRow(row: any, bankAccountId: string): TransactionInsertDTO | null
}