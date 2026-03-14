// import { BankAccountModel } from "../../models/bankAccount.js"
// import { TransactionMapper } from "./transaction.mapper.js";
// import { TransactionModel } from "../../models/transaction.js";

// export const TransactionService = {

//   async applyPlaidSyncResult(
//     plaidItemId: string,
//     result: PlaidSyncResult
//   ) {

//     const accounts =
//       await BankAccountModel.findByPlaidItemId(plaidItemId)

//     const accountMap = new Map(
//       accounts.map(a => [a.plaid_account_id, a.id])
//     )

//     const dtos = result.added
//       .map(txn => {
//         const bankAccountId =
//           accountMap.get(txn.account_id)

//         if (!bankAccountId) return null

//         return TransactionMapper.mapPlaidTxnToDTO(
//           txn,
//           bankAccountId
//         )
//       })
//       .filter(Boolean)

//     await TransactionModel.bulkInsertPlaid(dtos)

//     await TransactionModel.softDeleteByPlaidIds(
//       result.removed.map(r => r.transaction_id)
//     )

//     await PlaidItemModel.updateCursor(
//       plaidItemId,
//       result.cursor
//     )

//     return {
//       inserted: dtos.length,
//       removed: result.removed.length
//     }
//   }

// }