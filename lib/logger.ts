import * as Sentry from "@sentry/nextjs"

// Vercel sets VERCEL_ENV to 'production' | 'preview' | 'development' - NODE_ENV
// alone can't tell production apart from a preview deploy (Vercel sets it to
// 'production' for both), which would otherwise hide debug logs on previews too.
// VERCEL_ENV isn't inlined into the browser bundle, so the client reads the
// NEXT_PUBLIC_-prefixed copy instead (same pattern as instrumentation-client.ts).
export function isProductionEnvironment(): boolean {
  const vercelEnv = typeof window === "undefined" ? process.env.VERCEL_ENV : process.env.NEXT_PUBLIC_VERCEL_ENV
  return (vercelEnv ?? process.env.NODE_ENV) === "production"
}

function isMongooseValidationError(err: unknown): err is Error & { errors: Record<string, unknown> } {
  return err instanceof Error && err.name === "ValidationError" && "errors" in err
}

// Mongoose ValidationError messages can echo the offending submitted value
// (e.g. an enum mismatch) - report only which fields failed, not their values.
function sanitizeForSentry(err: unknown): unknown {
  if (isMongooseValidationError(err)) {
    const fields = Object.keys(err.errors)
    const sanitized = new Error(`Mongoose validation failed for field(s): ${fields.join(", ")}`)
    sanitized.name = err.name
    sanitized.stack = err.stack
    return sanitized
  }
  return err
}

function gatedConsole(method: "log" | "debug" | "warn", args: unknown[]): void {
  if (!isProductionEnvironment()) {
    console[method](...args)
  }
}

// Single logging entry point for both client and server code. `log`/`debug`/
// `warn` are dev/preview-only and never reach Sentry - use them for anything
// that isn't an actual failure. `error` always reports to Sentry (sanitized)
// and additionally echoes to the console outside production - never to the
// client response body, so pair it with a generic client-facing message.
export const logger = {
  log: (...args: unknown[]) => gatedConsole("log", args),
  debug: (...args: unknown[]) => gatedConsole("debug", args),
  warn: (...args: unknown[]) => gatedConsole("warn", args),
  error: (context: string, err?: unknown): void => {
    Sentry.captureException(sanitizeForSentry(err ?? new Error(context)))
    if (!isProductionEnvironment()) {
      if (err !== undefined) {
        console.error(context, err)
      } else {
        console.error(context)
      }
    }
  },
}
