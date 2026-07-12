import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { resendVerificationSchema } from "@/lib/validation"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = resendVerificationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // WAS-32: same anti-enumeration behavior as request-reset.
  await AuthService.resendVerification(parsed.data.email)

  return NextResponse.json({
    message: "If an account exists for that email, a verification link has been sent.",
  })
}
