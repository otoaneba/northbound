import express from "express"
import { authMiddleware } from "../middleware/auth.js"
import { TransactionController } from "../controllers/transaction.js"

export const transactionRoutes = express.Router()

transactionRoutes.get("/", authMiddleware, TransactionController.listForUser)
