// app/api/quiz/[id]/update/route.ts
import { NextResponse, NextRequest } from "next/server"
import { connectDB } from "@/lib/mongoose"
import QuizResultModel from "@/models/QuizResult"
import { getUserIdFromRequest } from "@/lib/jwt"

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  await connectDB()

  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = context.params
  if (!id) {
    return NextResponse.json({ error: "Missing quiz result ID" }, { status: 400 })
  }

  const updates = await req.json()

  try {
    const updated = await QuizResultModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).lean()

    if (!updated) {
      return NextResponse.json({ error: "Quiz result not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error("Update quiz result failed:", err)
    return NextResponse.json({ error: "Failed to update quiz result" }, { status: 500 })
  }
}
