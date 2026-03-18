import fs from "fs"
import { parseCsvFile } from "./csv.parser.js"
import { resolveCsvAdapter } from "./csv.adapterRegistry.js"
import { TransactionModel } from "../../models/transaction.js"

export const CsvService = {

  async ingestCsvFile(filePath: string, bankAccountId: string) {
    // 1️⃣ parse raw rows
    const { rows, headers } = await parseCsvFile(filePath)

    // 2️⃣ detect adapter
    const adapter = resolveCsvAdapter(headers, rows)

    // 3️⃣ map rows → DTO
    const dtos = []

    for (const row of rows) {
      const dto = adapter.mapRow(row, bankAccountId)
      if (!dto) continue
      console.log(dto.date)
      dtos.push(dto)
    }

    // 4️⃣ bulk insert
    const inserted = await TransactionModel.bulkInsertCsv(dtos)

    // 5️⃣ cleanup temp file
    await fs.promises.unlink(filePath).catch((err) => {
      console.warn("Failed to delete temp file:", filePath, err.message)
    })

    return {
      inserted,
      received: rows.length
    }
  }
}