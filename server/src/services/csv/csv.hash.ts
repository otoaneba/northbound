import crypto from "crypto"

export function buildCsvRowHash(bankAccountId: string, date: string, amount: number, name: string): string {

  const normalizedName = name.trim().toLowerCase();

  const key = `${bankAccountId}|${date}|${amount.toFixed(2)}|${normalizedName}`;

  return crypto
    .createHash("sha256")
    .update(key)
    .digest("hex")
}