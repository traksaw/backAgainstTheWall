import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { getUserIdFromRequest } from "@/lib/jwt"
import { reportServerError } from "@/lib/server-error"

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
    reportServerError("Failed to get user profile:", err)
    return NextResponse.json({ error: "Failed to get user profile" }, { status: 400 })
  }
}
