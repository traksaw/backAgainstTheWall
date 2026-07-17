import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { resendVerificationSchema } from "@/lib/validation"
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

  const parsed = resendVerificationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }

  const emailCheck = await checkRateLimit(emailLimiter, [`email:${parsed.data.email}`])
  if (!emailCheck.allowed) {
    return tooManyRequests(emailCheck.retryAfterSeconds)
  }

  // WAS-32: same anti-enumeration behavior as request-reset.
  await AuthService.resendVerification(parsed.data.email)

  return NextResponse.json({
    message: "If an account exists for that email, a verification link has been sent.",
  })
}
