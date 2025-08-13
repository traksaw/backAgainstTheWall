// Update your app/api/quiz/submit/route.ts
import { NextResponse, NextRequest } from "next/server"
import QuizResultModel from "@/models/QuizResult"
import { connectDB } from "@/lib/mongoose"
import mongoose from "mongoose"
import { getUserIdFromRequest } from "@/lib/jwt"

export async function POST(req: NextRequest) {  
  try {
    await connectDB()
    const userId = await getUserIdFromRequest(req)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    console.log("=== QUIZ SUBMIT API DEBUG ===")
    console.log("Raw request body:", body)
    
    // ✅ FIXED: Better data extraction logic
    let quizAnswers, sessionId, archetype, score
    
    if (body.answers) {
      // Data structure: { answers: {...}, sessionId: "...", archetype: "...", score: 123 }
      quizAnswers = body.answers
      sessionId = body.sessionId
      archetype = body.archetype
      score = body.score
    } else {
      // Legacy data structure or different format
      console.log("Using legacy data structure")
      quizAnswers = body.quizAnswers || body
      sessionId = body.sessionId
      archetype = body.archetype
      score = body.score
    }

    console.log("Extracted data:", {
      quizAnswers: quizAnswers ? Object.keys(quizAnswers).length : 0,
      sessionId,
      archetype,
      score
    })

    // Validate required fields
    if (!quizAnswers) {
      console.error("Missing quiz answers field")
      return NextResponse.json({ error: "Missing quiz answers field" }, { status: 400 })
    }
    
    if (!archetype || archetype === 'undefined') {
      console.error("Missing or invalid archetype field:", archetype)
      return NextResponse.json({ error: "Missing or invalid archetype field" }, { status: 400 })
    }
    
    if (score === undefined || score === null || isNaN(score)) {
      console.error("Missing or invalid score field:", score)
      return NextResponse.json({ error: "Missing or invalid score field" }, { status: 400 })
    }

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
    Object.values(quizAnswers).forEach((answer: any) => {
      if (answer.archetype && answer.points) {
        answerStructure.scores[answer.archetype as keyof typeof answerStructure.scores] += answer.points
      }
    })
    
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
    
  } catch (err: any) {
    console.error("=== QUIZ SUBMIT ERROR ===")
    console.error("Error name:", err.name)
    console.error("Error message:", err.message)
    console.error("Error stack:", err.stack)
    
    if (err.name === 'ValidationError') {
      console.error("Validation errors:", err.errors)
    }
    
    return NextResponse.json({ 
      error: "Failed to submit quiz", 
      details: err.message,
      validation: err.name === 'ValidationError' ? err.errors : undefined
    }, { status: 500 })
  }
}