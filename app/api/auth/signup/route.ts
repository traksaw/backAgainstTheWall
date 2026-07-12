// app/api/auth/signup/route.ts

import { NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { AuthService } from "@/lib/auth"
import { signToken } from "@/lib/jwt"
import { signUpSchema } from "@/lib/validation"

export async function POST(req: Request) {
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
    if (!(err instanceof Error && err.message === 'User already exists')) {
      Sentry.captureException(err)
    }
    const error = err instanceof Error ? err.message : 'Failed to create user'
    return NextResponse.json({ error }, { status: 400 })
  }
}