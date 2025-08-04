// app/api/auth/signup/route.ts

import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { signToken } from "@/lib/jwt"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const user = await AuthService.signUp(data)
    
    // Auto-sign in the user after successful signup
    const token = signToken({ userId: user._id.toString() })

    const res = NextResponse.json({
      id: user._id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    })

    // Set the JWT cookie
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return res
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}