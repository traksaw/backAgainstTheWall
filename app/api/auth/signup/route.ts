// app/api/auth/signup/route.ts

import { NextResponse } from "next/server"
import { AuthService, DuplicateAccountError } from "@/lib/auth"
import { signToken } from "@/lib/jwt"
import { signUpSchema } from "@/lib/validation"
import { authLimiter, checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

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
    const parsed = signUpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const emailCheck = await checkRateLimit(authLimiter, [`email:${parsed.data.email}`])
    if (!emailCheck.allowed) {
      return tooManyRequests(emailCheck.retryAfterSeconds)
    }

    const user = await AuthService.signUp(parsed.data)

    // Auto-sign in the user after successful signup
    const token = signToken({ userId: user._id.toString() })

    const res = NextResponse.json({
      id: user._id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    })

    // Set the JWT cookie
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return res
  } catch (err) {
    // A duplicate signup attempt is expected user behavior, not a bug - only
    // report anything else (DB errors, token signing failures, etc).
    if (err instanceof DuplicateAccountError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    logger.error("Signup failed:", err)
    return NextResponse.json({ error: "Failed to create account" }, { status: 400 })
  }
}
