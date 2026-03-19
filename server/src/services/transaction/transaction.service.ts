import { BankAccountModel } from "../../models/bankAccount.js"
import { TransactionModel } from "../../models/transaction.js"
import { PlaidItemModel } from "../../models/plaidItem.js"
import { TransactionMapper } from "./transaction.mapper.js"
import type { Transaction as PlaidTxn, RemovedTransaction, AccountBase } from "plaid"
import type { TransactionInsertDTO } from "./transaction.types.js"

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
  }

}