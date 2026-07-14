import { NextResponse, NextRequest } from "next/server"
import * as Sentry from "@sentry/nextjs"
import QuizResultModel from "@/models/QuizResult"
import connectDB from "@/lib/mongoose"
import mongoose from "mongoose"
import { getUserIdFromRequest } from "@/lib/jwt"
import { quizSubmitSchema } from "@/lib/validation"
import { calculateQuizScores, getWinningArchetype } from "@/lib/quiz/utils"
import { quizQuestions } from "@/lib/quiz/questions"
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
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { answers: quizAnswers, sessionId } = parsed.data
    const answerCount = Object.keys(quizAnswers).length

    // WAS-89: a real quiz attempt answers at least one and at most one
    // question per real question - reject anything outside that range
    // instead of letting a client flood fabricated answers to inflate an
    // archetype's total, or hit getWinningArchetype's all-zero-scores throw.
    if (answerCount < 1 || answerCount > quizQuestions.length) {
      return NextResponse.json(
        { error: "Invalid request body", details: "answers must contain between 1 and " + quizQuestions.length + " entries" },
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

    // Calculate structured answers for the database
    const answerStructure = {
      responses: quizAnswers,
      scores,
      totalQuestions: Object.keys(quizAnswers).length,
      completedAt: new Date().toISOString()
    }

    const quizResultData = {
      userId: new mongoose.Types.ObjectId(userId),
      answers: answerStructure,
      sessionId: sessionId || undefined,
      archetype,
      score,
    }

    const newResult = await QuizResultModel.create(quizResultData)

    if (process.env.NODE_ENV !== 'production') {
      console.log("Quiz result created:", newResult._id)
    }

    return NextResponse.json(newResult)

  } catch (err) {
    // Full error (message/stack/Mongoose validation payload) goes only to
    // Sentry, never to the client response or production console - those
    // can carry submitted quiz answers or other user-identifying detail.
    Sentry.captureException(err)
    if (process.env.NODE_ENV !== 'production') {
      console.error("Quiz submit error:", err)
    }

    return NextResponse.json({
      error: "Failed to submit quiz"
    }, { status: 500 })
  }
}