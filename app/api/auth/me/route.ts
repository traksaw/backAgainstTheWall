import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/jwt"
import { AuthService } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {

  try {
    const userId = await getUserIdFromRequest(req)    
    // Check if userId exists
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await AuthService.getUserProfile(userId)
    
    // Check if user exists
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (err) {
    logger.error("Error in auth/me route:", err)
    return NextResponse.json({ error: "Failed to load user profile" }, { status: 500 })
  }
}