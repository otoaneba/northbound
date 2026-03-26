import type { Request, Response, NextFunction } from "express"
import type { AuthenticatedRequest } from "../types/express.js"
import {
  TransactionService,
  type ListTransactionsQuery,
} from "../services/transaction/transaction.service.js"

export const TransactionController = {
  listForUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = (req as AuthenticatedRequest).user
      const q = req.query as Record<string, string | undefined>
      const query: ListTransactionsQuery = {}
      if (typeof q.startDate === "string") query.startDate = q.startDate
      if (typeof q.endDate === "string") query.endDate = q.endDate
      if (typeof q.bankAccountId === "string") query.bankAccountId = q.bankAccountId
      if (typeof q.source === "string") query.source = q.source
      if (typeof q.limit === "string") query.limit = q.limit
      const transactions = await TransactionService.listForUser(userId, query)
      return res.status(200).json({ transactions })
    } catch (error) {
      next(error)
    }
  },
}
