// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/jwt"
import { AuthService } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await AuthService.getUserProfile(userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
