import { BankAccountModel } from "../../models/bankAccount.js"
import { TransactionModel, type TransactionListRow } from "../../models/transaction.js"
import { PlaidItemModel } from "../../models/plaidItem.js"
import { TransactionMapper } from "./transaction.mapper.js"
import { ValidationError } from "../../utils/errors.js"
import type { Transaction as PlaidTxn, RemovedTransaction, AccountBase } from "plaid"
import type { TransactionInsertDTO } from "./transaction.types.js"

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export interface ListTransactionsQuery {
  startDate?: string
  endDate?: string
  bankAccountId?: string
  source?: string
  limit?: string
}

export interface TransactionListItem {
  id: string
  bankAccountId: string
  bankAccountName: string | null
  source: string
  date: string
  amount: number
  merchantName: string | null
  name: string | null
  pending: boolean
  isoCurrencyCode: string | null
  category: string | null
  createdAt: string
}

function mapRowToListItem(row: TransactionListRow): TransactionListItem {
  return {
    id: row.id,
    bankAccountId: row.bank_account_id,
    bankAccountName: row.bank_account_name,
    source: row.source,
    date: row.date,
    amount: Number(row.amount),
    merchantName: row.merchant_name,
    name: row.name,
    pending: row.pending,
    isoCurrencyCode: row.iso_currency_code,
    category: row.category,
    createdAt: row.created_at.toISOString(),
  }
}

interface PlaidSyncResult {
  added: PlaidTxn[]
  modified: PlaidTxn[]
  removed: RemovedTransaction[]
  accounts: AccountBase[]
  cursor: string
}

export const TransactionService = {

  async applyPlaidSyncResult(plaidItemId: string, result: PlaidSyncResult) {
    // 1️⃣ load internal bank accounts for this item
    const accounts = await BankAccountModel.findByPlaidItemId(plaidItemId)

    const accountMap = new Map(
      accounts.map(a => [a.plaid_account_id, a.id])
    )

    const dtos: TransactionInsertDTO[] = []

    for (const txn of result.added) {
      const bankAccountId =
        accountMap.get(txn.account_id)
  
      if (!bankAccountId) {
        console.warn(
          "Skipping txn, unknown account:",
          txn.account_id
        )
        continue
      }
  
      dtos.push(
        TransactionMapper.mapPlaidTxnToDTO(
          txn,
          bankAccountId
        )
      )
    }

    // 3️⃣ bulk insert
    const inserted = await TransactionModel.bulkInsertPlaid(dtos)

    // 4️⃣ persist cursor AFTER successful insert
    await PlaidItemModel.updateCursor(plaidItemId, result.cursor)

    return {
      inserted,
      received: result.added.length,
      cursor: result.cursor
    }
  },

  listForUser(userId: string, query: ListTransactionsQuery): Promise<TransactionListItem[]> {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("Invalid user ID", { userId })
    }

    let startDate: string | null = null
    if (query.startDate !== undefined && query.startDate !== "") {
      if (!ISO_DATE.test(query.startDate)) {
        throw new ValidationError("startDate must be YYYY-MM-DD", { startDate: query.startDate })
      }
      startDate = query.startDate
    }

    let endDate: string | null = null
    if (query.endDate !== undefined && query.endDate !== "") {
      if (!ISO_DATE.test(query.endDate)) {
        throw new ValidationError("endDate must be YYYY-MM-DD", { endDate: query.endDate })
      }
      endDate = query.endDate
    }

    if (startDate && endDate && startDate > endDate) {
      throw new ValidationError("startDate must be on or before endDate", { startDate, endDate })
    }

    let bankAccountId: string | null = null
    if (query.bankAccountId !== undefined && query.bankAccountId !== "") {
      if (!UUID_RE.test(query.bankAccountId)) {
        throw new ValidationError("bankAccountId must be a valid UUID", {
          bankAccountId: query.bankAccountId,
        })
      }
      bankAccountId = query.bankAccountId
    }

    let source: "plaid" | "csv" | null = null
    if (query.source !== undefined && query.source !== "") {
      if (query.source !== "plaid" && query.source !== "csv") {
        throw new ValidationError('source must be "plaid" or "csv"', { source: query.source })
      }
      source = query.source
    }

    const DEFAULT_LIMIT = 500
    const MAX_LIMIT = 2000
    let limit = DEFAULT_LIMIT
    if (query.limit !== undefined && query.limit !== "") {
      const n = Number.parseInt(query.limit, 10)
      if (!Number.isFinite(n) || n < 1) {
        throw new ValidationError("limit must be a positive integer", { limit: query.limit })
      }
      limit = Math.min(n, MAX_LIMIT)
    }

    return TransactionModel.findForUser({
      userId,
      startDate,
      endDate,
      bankAccountId,
      source,
      limit,
    }).then((rows) => rows.map(mapRowToListItem))
  },
}