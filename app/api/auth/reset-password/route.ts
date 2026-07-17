import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { resetPasswordSchema } from "@/lib/validation"
import { reportServerError } from "@/lib/server-error"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = resetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  try {
    await AuthService.resetPassword(parsed.data.token, parsed.data.password)
    return NextResponse.json({ message: "Password updated successfully." })
  } catch (err) {
    if (err instanceof Error && err.message === "Invalid or expired token") {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    reportServerError("Unexpected error in reset-password route:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
