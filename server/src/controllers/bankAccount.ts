import type { Request, Response, NextFunction } from "express"
import type { AuthenticatedRequest } from "../types/express.js"
import { BankAccountModel, type BankAccountListRow } from "../models/bankAccount.js"
import { ValidationError } from "../utils/errors.js"

function mapRowToResponse(row: BankAccountListRow) {
  return {
    id: row.id,
    name: row.name,
    mask: row.mask,
    type: row.type,
    subtype: row.subtype,
    officialName: row.official_name,
    linkedViaPlaid: row.plaid_item_uuid != null,
    createdAt: row.created_at.toISOString(),
  }
}

export const BankAccountController = {
  listForUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = (req as AuthenticatedRequest).user
      const rows = await BankAccountModel.findAccessibleByUserId(userId)
      return res.status(200).json({
        accounts: rows.map(mapRowToResponse),
      })
    } catch (error) {
      next(error)
    }
  },

  createManual: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = (req as AuthenticatedRequest).user
      const body = req.body as Record<string, unknown>

      const nameRaw = body.name
      if (typeof nameRaw !== "string" || nameRaw.trim() === "") {
        throw new ValidationError("name is required and must be a non-empty string")
      }

      const pickOptionalString = (key: string): string | null => {
        const v = body[key]
        if (v === undefined || v === null || v === "") return null
        if (typeof v !== "string") {
          throw new ValidationError(`${key} must be a string`, { [key]: v })
        }
        return v.trim() === "" ? null : v.trim()
      }

      const row = await BankAccountModel.createManualForUser({
        userId,
        name: nameRaw.trim(),
        mask: pickOptionalString("mask"),
        type: pickOptionalString("type"),
        subtype: pickOptionalString("subtype"),
        officialName: pickOptionalString("officialName"),
      })

      return res.status(201).json({
        account: mapRowToResponse(row),
      })
    } catch (error) {
      next(error)
    }
  },
}
