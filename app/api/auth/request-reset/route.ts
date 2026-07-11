import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { requestResetSchema } from "@/lib/validation"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = requestResetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // WAS-32: always return the same generic response whether or not the
  // email is registered - prevents this endpoint from being used to
  // enumerate accounts.
  await AuthService.requestPasswordReset(parsed.data.email)

  return NextResponse.json({
    message: "If an account exists for that email, a reset link has been sent.",
  })
}
