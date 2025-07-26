import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { signToken } from "@/lib/jwt"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  try {
    const user = await AuthService.signIn(email, password)
    const token = signToken({ userId: user.id }) // ✅ no nesting

    const res = NextResponse.json(user)

    // ✅ Set the cookie on the response
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return res
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}
