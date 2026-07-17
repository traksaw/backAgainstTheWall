import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { getUserIdFromRequest } from "@/lib/jwt"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  // WAS-7: identity must come from the session, never a client-supplied
  // userId - ObjectIds are enumerable via their embedded timestamp, so
  // trusting a body-supplied id let anyone fetch anyone else's profile.
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const profile = await AuthService.getUserProfile(userId)
    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json(profile)
  } catch (err) {
    logger.error("Failed to get user profile:", err)
    const error = err instanceof Error ? err.message : 'Failed to get user profile'
    return NextResponse.json({ error }, { status: 400 })
  }
}
