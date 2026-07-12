import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { verifyEmailSchema } from "@/lib/validation"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = verifyEmailSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    await AuthService.verifyEmail(parsed.data.token)
    return NextResponse.json({ message: "Email verified successfully." })
  } catch (err) {
    const error = err instanceof Error ? err.message : "Invalid or expired token"
    return NextResponse.json({ error }, { status: 400 })
  }
}
