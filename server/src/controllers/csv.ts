import type { Request, Response, NextFunction } from 'express';
import { CsvService } from '../services/csv/csv.service.js';
import type { AuthenticatedRequest } from '../types/express.js';

export const CsvController = {

  uploadCsv: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new Error("CSV file missing")
      }

      const filePath = req.file.path
      if (!filePath || typeof filePath !== "string") {
        throw new Error("CSV file path missing")
      }

      const bankAccountIdParam = req.params.bankAccountId
      const bankAccountId = typeof bankAccountIdParam === "string" ? bankAccountIdParam : undefined
      if (!bankAccountId) {
        throw new Error("Invalid bank account ID")
      }

      const summary = await CsvService.ingestCsvFile(filePath, bankAccountId)

      res.json({
        success: true,
        ...summary
      })

    } catch (err) {
      next(err)
    }
  }
}