import { NextResponse } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import * as Sentry from "@sentry/nextjs"

const redis = Redis.fromEnv()

// WAS-10: signin/signup are credential checks (bcrypt.compare) - 5 attempts
// per 5 minutes catches spraying/stuffing without punishing a typo-prone
// legitimate user.
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "5 m"),
  prefix: "ratelimit:auth",
})

// WAS-10: request-reset/resend-verification each trigger a real email send,
// so the threshold is tighter than a login attempt - this is an
// email-bombing vector against a victim's inbox, not just a guessing attack
// against us.
export const emailLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "15 m"),
  prefix: "ratelimit:email",
})

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }

// Each key (e.g. IP, email) is checked independently against the same
// limiter so an attacker can't dodge the block by rotating IPs against one
// email, or spraying many emails from one IP.
export async function checkRateLimit(limiter: Ratelimit, keys: string[]): Promise<RateLimitResult> {
  for (const key of keys) {
    try {
      const { success, reset } = await limiter.limit(key)
      if (!success) {
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) }
      }
    } catch (err) {
      // Fail open: this is an anti-abuse layer, not the auth boundary
      // itself - a Redis blip shouldn't lock every real user out of signin.
      Sentry.captureException(err)
    }
  }
  return { allowed: true }
}

export function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

export function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: `Too many attempts. Try again in ${retryAfterSeconds} seconds.` },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  )
}
