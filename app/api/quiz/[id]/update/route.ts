// app/api/quiz/[id]/update/route.ts
import { NextResponse, NextRequest } from "next/server"
import mongoose from "mongoose"
import connectDB from "@/lib/mongoose"
import QuizResultModel from "@/models/QuizResult"
import { getUserIdFromRequest } from "@/lib/jwt"
import { quizUpdateSchema } from "@/lib/validation"
import { reportServerError } from "@/lib/server-error"

// WAS-6: the only fields this endpoint is allowed to touch. Never spread the
// raw request body into an update - that's mass assignment, and it let any
// authenticated caller overwrite userId/archetype/score on any record.
const ALLOWED_UPDATE_FIELDS = ["hasViewedResults", "hasWatchedFilm"] as const

function pickAllowedFields(source: Record<string, unknown>) {
  const picked: Partial<Record<(typeof ALLOWED_UPDATE_FIELDS)[number], unknown>> = {}
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (field in source) picked[field] = source[field]
  }
  return picked
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await connectDB()

  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: "Missing quiz result ID" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = quizUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const updates = parsed.data

  try {
    // Filtering by { _id, userId } together means a result that exists but
    // belongs to someone else simply doesn't match - it falls into the same
    // "not found" branch below as a genuinely missing id, so this never
    // confirms record existence to an attacker (404, not 403).
    const updated = await QuizResultModel.findOneAndUpdate(
      { _id: id, userId: new mongoose.Types.ObjectId(userId) },
      { ...pickAllowedFields(updates), updatedAt: new Date() },
      { new: true }
    ).lean()

    if (!updated) {
      return NextResponse.json({ error: "Quiz result not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (err) {
    reportServerError("Update quiz result failed:", err)
    return NextResponse.json({ error: "Failed to update quiz result" }, { status: 500 })
  }
}
