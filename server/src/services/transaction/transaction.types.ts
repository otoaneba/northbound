export interface TransactionInsertDTO {
  bankAccountId: string
  source: "plaid" | "csv"

  plaidTransactionId: string | null
  csvRowHash: string | null

  date: string
  amount: number

  merchantName: string | null
  name: string | null

  pending: boolean
  isoCurrencyCode: string | null
  category: string | null
}