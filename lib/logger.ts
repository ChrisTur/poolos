import pino from "pino"

const isDev = process.env.NODE_ENV !== "production"

const logger = pino(
  isDev
    ? { level: process.env.LOG_LEVEL ?? "debug" }
    : {
        level: process.env.LOG_LEVEL ?? "info",
        formatters: {
          // GCP Cloud Logging expects "severity", not "level"
          level(label) {
            return { severity: label.toUpperCase() }
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      },
  isDev
    ? pino.transport({ target: "pino-pretty", options: { colorize: true, ignore: "pid,hostname" } })
    : undefined,
)

export default logger

export const authLog     = logger.child({ module: "auth" })
export const invoiceLog  = logger.child({ module: "invoices" })
export const paymentLog  = logger.child({ module: "payments" })
export const emailLog    = logger.child({ module: "email" })
export const storageLog  = logger.child({ module: "storage" })
