import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { requestResetSchema } from "@/lib/validation"
import { checkRateLimit, emailLimiter, getClientIp, tooManyRequests } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const ipCheck = await checkRateLimit(emailLimiter, [`ip:${getClientIp(req)}`])
  if (!ipCheck.allowed) {
    return tooManyRequests(ipCheck.retryAfterSeconds)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = requestResetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const emailCheck = await checkRateLimit(emailLimiter, [`email:${parsed.data.email}`])
  if (!emailCheck.allowed) {
    return tooManyRequests(emailCheck.retryAfterSeconds)
  }

  // WAS-32: always return the same generic response whether or not the
  // email is registered - prevents this endpoint from being used to
  // enumerate accounts.
  await AuthService.requestPasswordReset(parsed.data.email)

  return NextResponse.json({
    message: "If an account exists for that email, a reset link has been sent.",
  })
}
