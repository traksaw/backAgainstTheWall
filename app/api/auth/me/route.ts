import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/jwt"
import { AuthService } from "@/lib/auth"

export async function GET(req: NextRequest) {
  console.log('=== AUTH DEBUG INFO ===')
  
  // Debug: Log all cookies
  console.log('All cookies:', req.cookies.getAll())
  
  // Debug: Log specific token cookie
  const tokenCookie = req.cookies.get("token")
  console.log('Token cookie:', tokenCookie)
  
  // Debug: Log authorization header (in case token is sent via header)
  const authHeader = req.headers.get('authorization')
  console.log('Authorization header:', authHeader)
  
  try {
    const userId = await getUserIdFromRequest(req)
    console.log('Extracted userId:', userId)
    
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
  } catch (err: any) {
    console.log('Error in auth route:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}