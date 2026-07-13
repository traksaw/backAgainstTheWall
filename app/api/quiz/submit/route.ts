// Update your app/api/quiz/submit/route.ts
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

    // WAS-89: a real quiz attempt answers at most one question per real
    // question - reject anything else instead of letting a client flood
    // fabricated answers to inflate an archetype's total.
    if (Object.keys(quizAnswers).length > quizQuestions.length) {
      return NextResponse.json(
        { error: "Invalid request body", details: "Too many answers submitted" },
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

    console.log("Calculated archetype scores:", answerStructure.scores)

    const quizResultData = {
      userId: new mongoose.Types.ObjectId(userId),
      answers: answerStructure,
      sessionId: sessionId || undefined,
      archetype,
      score,
    }

    console.log("Creating quiz result with data:", {
      userId,
      archetype,
      score,
      totalQuestions: answerStructure.totalQuestions
    })

    const newResult = await QuizResultModel.create(quizResultData)
    console.log("Quiz result created successfully:", newResult._id)

    return NextResponse.json(newResult)
    
  } catch (err) {
    console.error("=== QUIZ SUBMIT ERROR ===")
    Sentry.captureException(err)
    if (err instanceof Error) {
      console.error("Error name:", err.name)
      console.error("Error message:", err.message)
      console.error("Error stack:", err.stack)
      
      if (err.name === 'ValidationError' && 'errors' in err) {
        console.error("Validation errors:", (err as { errors: unknown }).errors)
        return NextResponse.json({ 
          error: "Failed to submit quiz", 
          details: err.message,
          validation: (err as { errors: unknown }).errors
        }, { status: 500 })
      }

      return NextResponse.json({ 
        error: "Failed to submit quiz", 
        details: err.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      error: "Failed to submit quiz", 
      details: "Unknown error occurred"
    }, { status: 500 })
  }
}