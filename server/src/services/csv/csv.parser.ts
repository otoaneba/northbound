import fs from "fs"
import csv from "csv-parser"

export function parseCsvFile(
  filePath: string
): Promise<any[]> {

  return new Promise((resolve, reject) => {
    const results: any[] = []

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject)
  })
}