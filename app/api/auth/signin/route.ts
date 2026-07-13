import { NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { AuthService } from "@/lib/auth"
import { signToken } from "@/lib/jwt"
import { signInSchema } from "@/lib/validation"
import { authLimiter, checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const ipCheck = await checkRateLimit(authLimiter, [`ip:${getClientIp(req)}`])
  if (!ipCheck.allowed) {
    return tooManyRequests(ipCheck.retryAfterSeconds)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  try {
    const parsed = signInSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { email, password } = parsed.data

    const emailCheck = await checkRateLimit(authLimiter, [`email:${email}`])
    if (!emailCheck.allowed) {
      return tooManyRequests(emailCheck.retryAfterSeconds)
    }

    const user = await AuthService.signIn(email, password)
    
    const token = signToken({ userId: user._id.toString() })

    const res = NextResponse.json({
      id: user._id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      // Don't send back the passwordHash
    })

    // Set the cookie on the response
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return res
  } catch (err) {
    // Wrong email/password is expected user behavior, not a bug - only
    // report anything else (DB errors, token signing failures, etc).
    if (!(err instanceof Error && err.message === 'Invalid email or password')) {
      Sentry.captureException(err)
    }
    const error = err instanceof Error ? err.message : 'Invalid email or password'
    return NextResponse.json({ error }, { status: 401 })
  }
}