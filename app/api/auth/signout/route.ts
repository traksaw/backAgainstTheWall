import { cookies } from "next/headers"
import { verifyToken } from "@/lib/jwt"
import { NextResponse } from "next/server"

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    return NextResponse.json({ error: "No token found" }, { status: 401 })
  }

  try {
    verifyToken(token)
  } catch {
    // verifyToken throws (rather than returning null) on an invalid or
    // expired token - without this catch that exception was uncaught,
    // producing a 500 instead of the 401 this route always intended.
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
