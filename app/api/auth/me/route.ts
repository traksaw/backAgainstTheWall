import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { getUserIdFromRequest } from "@/lib/jwt"
import { AuthService } from "@/lib/auth"

export async function GET(req: NextRequest) {

  try {
    const userId = await getUserIdFromRequest(req)    
    // Check if userId exists
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized",
        debug: {
          cookiesFound: req.cookies.getAll().length,
          hasTokenCookie: !!req.cookies.get("token"),
          hasAuthHeader: !!req.headers.get('authorization')
        }
      }, { status: 401 })
    }

    const user = await AuthService.getUserProfile(userId)
    
    // Check if user exists
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (err) {
    const error = err as Error
    console.log('Error in auth route:', error)
    Sentry.captureException(err)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}