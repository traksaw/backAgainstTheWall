// Update your app/api/quiz/submit/route.ts
import { NextResponse, NextRequest } from "next/server"
import QuizResultModel from "@/models/QuizResult"
import connectDB from "@/lib/mongoose"
import mongoose from "mongoose"
import { getUserIdFromRequest } from "@/lib/jwt"
import { quizSubmitSchema } from "@/lib/validation"

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
    const { answers: quizAnswers, sessionId, archetype, score } = parsed.data

    // Calculate structured answers for the database
    const answerStructure = {
      responses: quizAnswers,
      scores: {
        Avoider: 0,
        Gambler: 0, 
        Realist: 0,
        Architect: 0
      },
      totalQuestions: Object.keys(quizAnswers).length,
      completedAt: new Date().toISOString()
    }

    // Calculate scores from answers
    Object.values(quizAnswers).forEach((answer) => {
      if (answer.archetype && answer.points) {
        answerStructure.scores[answer.archetype as keyof typeof answerStructure.scores] += answer.points
      }
    })

    console.log("Calculated archetype scores:", answerStructure.scores)
    
    const quizResultData = {
      userId: new mongoose.Types.ObjectId(userId),
      answers: answerStructure,
      sessionId: sessionId || undefined,
      archetype: archetype,
      score: Number(score),
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