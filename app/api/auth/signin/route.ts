import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { signToken } from "@/lib/jwt"
import { signInSchema } from "@/lib/validation"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  try {
    const parsed = signInSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { email, password } = parsed.data

    const user = await AuthService.signIn(email, password)
    
    const token = signToken({ userId: user._id.toString() })

    const res = NextResponse.json({
      id: user._id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      // Don't send back the passwordHash
    })

    // Set the cookie on the response
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return res
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Invalid email or password'
    return NextResponse.json({ error }, { status: 401 })
  }
}