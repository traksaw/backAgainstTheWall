import { NextResponse, NextRequest } from "next/server"
import QuizResultModel from "@/models/QuizResult"
import { connectDB } from "@/lib/mongoose"
import mongoose from "mongoose"
import { getUserIdFromRequest } from "@/lib/jwt"

export async function POST(req: NextRequest) {
  console.log('=== QUIZ SUBMIT BACKEND DEBUG ===')
  
  try {
    await connectDB()
    console.log('Database connected successfully')

    const userId = await getUserIdFromRequest(req)
    console.log('Extracted userId in quiz submit:', userId)
    
    if (!userId) {
      console.log('No userId found in quiz submit - returning 401')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    console.log('Quiz submission body received:', JSON.stringify(body, null, 2))
    
    // ✅ Fix: The actual data is nested inside body.answers
    const actualData = body.answers || body // Handle both structures
    const quizAnswers = actualData.answers
    const sessionId = actualData.sessionId
    const archetype = actualData.archetype
    const score = actualData.score
    
    console.log('Extracted values from nested structure:', { 
      answersCount: Object.keys(quizAnswers || {}).length,
      sessionId, 
      archetype, 
      score,
      archetypeType: typeof archetype,
      scoreType: typeof score
    })

    // Validate required fields
    if (!quizAnswers) {
      console.log('Missing quiz answers field')
      return NextResponse.json({ error: "Missing quiz answers field" }, { status: 400 })
    }
    
    if (!archetype || archetype === 'undefined') {
      console.log('Missing or invalid archetype field:', archetype)
      return NextResponse.json({ error: "Missing or invalid archetype field" }, { status: 400 })
    }
    
    if (score === undefined || score === null || isNaN(score)) {
      console.log('Missing or invalid score field:', score)
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

    console.log('Structured answers:', JSON.stringify(answerStructure, null, 2))

    const quizResultData = {
      userId: new mongoose.Types.ObjectId(userId),
      answers: answerStructure,
      sessionId: sessionId || undefined,
      archetype: archetype,
      score: Number(score),
    }

    console.log('About to create QuizResult with data:', JSON.stringify(quizResultData, null, 2))

    const newResult = await QuizResultModel.create(quizResultData)

    console.log('Quiz result created successfully with ID:', newResult._id)
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