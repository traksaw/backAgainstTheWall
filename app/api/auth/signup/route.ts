// app/api/auth/signup/route.ts

import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const user = await AuthService.signUp(data)
    return NextResponse.json(user)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
