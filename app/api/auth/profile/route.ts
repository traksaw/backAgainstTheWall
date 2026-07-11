import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { getUserIdFromRequest } from "@/lib/jwt"

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
    return NextResponse.json(profile)
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to get user profile'
    return NextResponse.json({ error }, { status: 400 })
  }
}
