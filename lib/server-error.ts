import * as Sentry from "@sentry/nextjs"

// Vercel sets VERCEL_ENV to 'production' | 'preview' | 'development' - NODE_ENV
// alone can't tell production apart from a preview deploy (Vercel sets it to
// 'production' for both), which would otherwise hide debug logs on previews too.
export function isProductionEnvironment(): boolean {
  return (process.env.VERCEL_ENV ?? process.env.NODE_ENV) === "production"
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

// Sends the real error to Sentry (sanitized) and, outside production, to the
// console - never to the client response. Use a generic client-facing
// message alongside this call instead of err.message or Mongoose internals.
export function reportServerError(context: string, err: unknown): void {
  Sentry.captureException(sanitizeForSentry(err))
  if (!isProductionEnvironment()) {
    console.error(context, err)
  }
}
