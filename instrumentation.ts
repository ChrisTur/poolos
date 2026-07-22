import { validateEnv } from "@/lib/env"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    validateEnv()
  }
}
