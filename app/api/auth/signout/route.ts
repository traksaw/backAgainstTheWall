import { cookies } from "next/headers"
import { verifyToken } from "@/lib/jwt"
import { NextResponse } from "next/server"

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    return NextResponse.json({ error: "No token found" }, { status: 401 })
  }

  const decoded = verifyToken(token)

  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
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
