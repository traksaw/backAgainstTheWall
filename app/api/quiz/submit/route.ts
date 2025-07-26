// app/api/quiz/submit/route.ts
import { NextResponse, NextRequest } from "next/server"
import QuizResultModel from "@/models/QuizResult"
import { connectDB } from "@/lib/mongoose"
import mongoose from "mongoose"
import { getUserIdFromRequest } from "@/lib/jwt"

export async function POST(req: NextRequest) {
  await connectDB()

  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { answers, sessionId, archetype, score } = body

    const newResult = await QuizResultModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      answers,
      sessionId,
      archetype,
      score,
    })

    return NextResponse.json(newResult)
  } catch (err: any) {
    console.error("Submit quiz failed:", err)
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 })
  }
}
