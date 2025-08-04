import { NextResponse, NextRequest } from "next/server"
import { getUserIdFromRequest } from "@/lib/jwt"
import { connectDB } from "@/lib/mongoose"
import QuizResultModel from "@/models/QuizResult"
import mongoose from "mongoose"

export async function GET(req: NextRequest) {
  console.log('=== QUIZ RESULTS DEBUG ===')
  
  // Debug: Check cookies
  const tokenCookie = req.cookies.get("token")
  console.log('Token cookie in quiz results:', tokenCookie)
  
  await connectDB()

  const userId = await getUserIdFromRequest(req)
  console.log('Extracted userId in quiz results:', userId)
  
  if (!userId) {
    console.log('No userId found - returning 401')
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log('Searching for quiz results with userId:', userId)
    const results = await QuizResultModel.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean()

    console.log('Found quiz results:', results.length, 'results')
    return NextResponse.json(results)
  } catch (err: any) {
    console.error("Failed to fetch quiz results:", err)
    return NextResponse.json({ error: "Failed to fetch quiz results" }, { status: 500 })
  }
}