import express from "express"
import { authMiddleware } from "../middleware/auth.js"
import { BankAccountController } from "../controllers/bankAccount.js"

export const bankAccountRoutes = express.Router()

bankAccountRoutes.get("/", authMiddleware, BankAccountController.listForUser)
bankAccountRoutes.post("/", authMiddleware, BankAccountController.createManual)
