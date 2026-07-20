import { NextResponse, NextRequest } from "next/server"
import QuizResultModel from "@/models/QuizResult"
import QuizAttemptModel from "@/models/QuizAttempt"
import connectDB from "@/lib/mongoose"
import mongoose from "mongoose"
import { getUserIdFromRequest } from "@/lib/jwt"
import { quizSubmitSchema } from "@/lib/validation"
import { calculateQuizScores, getWinningArchetype } from "@/lib/quiz/utils"
import { validateAnswersAgainstLayout } from "@/lib/quiz/attempt"
import { logger } from "@/lib/logger"
import type { QuizAnswer } from "@/types/quiz"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const userId = await getUserIdFromRequest(req)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const parsed = quizSubmitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }
    const { answers: quizAnswers, sessionId } = parsed.data

    const attempt = await QuizAttemptModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      sessionId,
      status: "in_progress",
    })

    if (!attempt) {
      return NextResponse.json(
        { error: "Invalid request body", details: "no in-progress quiz attempt for this session" },
        { status: 400 }
      )
    }

    if (attempt.expiresAt.getTime() < Date.now()) {
      attempt.status = "expired"
      await attempt.save()
      return NextResponse.json(
        { error: "Invalid request body", details: "quiz attempt has expired" },
        { status: 400 }
      )
    }

    const layoutCheck = validateAnswersAgainstLayout(quizAnswers, attempt.layout)
    if (!layoutCheck.ok) {
      return NextResponse.json(
        { error: "Invalid request body", details: layoutCheck.reason },
        { status: 400 }
      )
    }

    // quizAnswerSchema only validates the fields scoring needs (archetype,
    // points); QuizAnswer also carries display-only fields (text, etc.) that
    // calculateQuizScores/getWinningArchetype never read.
    const scorableAnswers = quizAnswers as unknown as Record<number, QuizAnswer>

    // Recompute archetype/score server-side (WAS-89) - never trust client-supplied values
    const scores = calculateQuizScores(scorableAnswers)
    const archetype = getWinningArchetype(scores, scorableAnswers)
    const score = scores[archetype]

    const answerStructure = {
      responses: quizAnswers,
      scores,
      totalQuestions: attempt.layout.length,
      completedAt: new Date().toISOString(),
    }

    const quizResultData = {
      userId: new mongoose.Types.ObjectId(userId),
      answers: answerStructure,
      sessionId,
      archetype,
      score,
    }

    const newResult = await QuizResultModel.create(quizResultData)

    attempt.status = "completed"
    await attempt.save()

    logger.log("Quiz result created:", newResult._id)

    return NextResponse.json(newResult)
  } catch (err) {
    logger.error("Quiz submit error:", err)

    return NextResponse.json({
      error: "Failed to submit quiz",
    }, { status: 500 })
  }
}
