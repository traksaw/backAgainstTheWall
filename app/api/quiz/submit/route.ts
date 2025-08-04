// app/api/quiz/submit/route.ts
import { NextResponse, NextRequest } from "next/server"
import QuizResultModel from "@/models/QuizResult"
import { connectDB } from "@/lib/mongoose"
import mongoose from "mongoose"
import { getUserIdFromRequest } from "@/lib/jwt"

export async function POST(req: NextRequest) {
  console.log('=== QUIZ SUBMIT DEBUG ===')
  
  // Debug: Check cookies
  const tokenCookie = req.cookies.get("token")
  console.log('Token cookie in quiz submit:', tokenCookie)
  
  await connectDB()

  const userId = await getUserIdFromRequest(req)
  console.log('Extracted userId in quiz submit:', userId)
  
  if (!userId) {
    console.log('No userId found in quiz submit - returning 401')
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    console.log('Quiz submission body:', body)
    
    const { answers, sessionId, archetype, score } = body

    console.log('Creating quiz result with:', {
      userId: userId,
      archetype,
      score,
      sessionId
    })

    const newResult = await QuizResultModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      answers,
      sessionId,
      archetype,
      score,
    })

    console.log('Quiz result created successfully:', newResult._id)
    return NextResponse.json(newResult)
  } catch (err: any) {
    console.error("Submit quiz failed:", err)
    return NextResponse.json({ error: "Failed to submit quiz", details: err.message }, { status: 500 })
  }
}