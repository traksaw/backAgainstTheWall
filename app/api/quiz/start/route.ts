import { NextResponse, NextRequest } from "next/server"
import mongoose from "mongoose"
import connectDB from "@/lib/mongoose"
import { getUserIdFromRequest } from "@/lib/jwt"
import QuizAttemptModel from "@/models/QuizAttempt"
import { fetchQuizQuestions } from "@/lib/quiz/content"
import {
  createAdvancedRandomizedQuestions,
  generateSessionId,
} from "@/lib/quiz/utils"
import { QUIZ_ATTEMPT_TTL_MS } from "@/lib/quiz/attempt"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const userId = await getUserIdFromRequest(req)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const questions = await fetchQuizQuestions()
    if (!questions.length) {
      return NextResponse.json(
        { error: "Failed to start quiz" },
        { status: 500 }
      )
    }

    const layout = createAdvancedRandomizedQuestions(questions)
    const sessionId = generateSessionId()
    const expiresAt = new Date(Date.now() + QUIZ_ATTEMPT_TTL_MS)

    await QuizAttemptModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      sessionId,
      layout,
      status: "in_progress",
      expiresAt,
    })

    return NextResponse.json({ sessionId, questions: layout })
  } catch (err) {
    logger.error("Quiz start error:", err)
    return NextResponse.json(
      { error: "Failed to start quiz" },
      { status: 500 }
    )
  }
}
