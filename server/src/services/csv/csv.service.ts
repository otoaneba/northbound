import fs from "fs"
import { parseCsvFile } from "./csv.parser.js"
import { resolveCsvAdapter } from "./csv.adapterRegistry.js"
import { TransactionModel } from "../../models/transaction.js"

export const CsvService = {

  async ingestCsvFile(filePath: string, bankAccountId: string) {
    // 1️⃣ parse raw rows
    const rows = await parseCsvFile(filePath)

    if (rows.length === 0) {
      return { inserted: 0, received: 0 }
    }

    // 2️⃣ detect adapter
    const adapter = resolveCsvAdapter(Object.keys(rows[0]))

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
    fs.unlink(filePath, () => {})

    return {
      inserted,
      received: rows.length
    }
  }
}