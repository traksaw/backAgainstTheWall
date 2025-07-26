import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"

export async function POST(req: Request) {
  const { userId } = await req.json()

  try {
    const profile = await AuthService.getUserProfile(userId)
    return NextResponse.json(profile)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
