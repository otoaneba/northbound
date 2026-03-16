import { ChaseAdapter } from "./adapters/chase.adapter.js"
import { BoaAdapter } from "./adapters/boa.adapter.js"
import { CapitalOneAdapter } from "./adapters/capitalOne.adapter.js"
import { AppleAdapter } from "./adapters/apple.adapter.js"

const adapters = [
  new ChaseAdapter(),
  new BoaAdapter(),
  new CapitalOneAdapter(),
  new AppleAdapter()
]

function resolveCsvAdapter(headers: string[]) {
  const adapter = adapters.find(a =>
    a.canHandle(headers)
  )

  if (!adapter) {
    throw new Error("Unsupported CSV format")
  }
  console.log("use this adapter: ", adapter)
  return adapter
}

export { resolveCsvAdapter }
