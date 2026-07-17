import { cookies } from "next/headers"
import { verifyToken } from "@/lib/jwt"
import { logger } from "@/lib/logger"
import { NextResponse } from "next/server"

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  // Sign-out is idempotent: the goal is "no active session", which is
  // already true whether the cookie is missing or the token on it can't be
  // verified. verifyToken throws (rather than returning null) on an invalid
  // or expired token, so that's not an error case here either - log it for
  // visibility and fall through to clearing the cookie and returning success.
  if (token) {
    try {
      verifyToken(token)
    } catch (error) {
      logger.warn("Invalid token on sign-out:", error)
    }
  }

  // Clear the token cookie
  cookieStore.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return NextResponse.json({ message: "Signed out successfully" })
}
