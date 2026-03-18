import fs from "fs"
import { Readable } from "stream"
import csv from "csv-parser"

export async function parseCsvFile(filePath: string): Promise<{ rows: any[]; headers: string[] }> {
  const raw = await fs.promises.readFile(filePath, "utf8")
  const lines = raw.split(/\r?\n/)

  // Detect BOA transaction header (skip summary section)
  const boaHeaderIdx = lines.findIndex((l) => l.startsWith("Date,Description,Amount"))

  const normalizedContent =
    boaHeaderIdx >= 0 ? lines.slice(boaHeaderIdx).join("\n") : raw

  return new Promise((resolve, reject) => {
    const results: any[] = []
    let headers: string[] = []

    Readable.from(normalizedContent)
      .pipe(csv())
      .on("headers", (h) => (headers = h))
      .on("data", (data) => results.push(data))
      .on("end", () => resolve({ rows: results, headers }))
      .on("error", reject)
  })
}
