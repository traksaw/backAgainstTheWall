import { NextResponse, NextRequest } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { getUserIdFromRequest } from "@/lib/jwt"
import connectDB from "@/lib/mongoose"
import QuizResultModel from "@/models/QuizResult"
import mongoose from "mongoose"

export async function GET(req: NextRequest) {
  
  await connectDB()

  const userId = await getUserIdFromRequest(req)
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const results = await QuizResultModel.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(results)
  } catch (err) {
    const error = err as Error
    console.error("Failed to fetch quiz results:", error)
    Sentry.captureException(err)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}