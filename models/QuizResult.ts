import { Schema, Document, Model } from "mongoose"
import mongoose from "@/lib/mongoose" // ✅ Import your shared instance

export interface IQuizResult extends Document {
  userId: typeof Schema.Types.ObjectId
  _id: string
  archetype: "Avoider" | "Gambler" | "Realist" | "Architect"
  score: number
  answers: {
    responses: Record<number, any>
    scores: Record<string, number>
    totalQuestions: number
    completedAt: string
  }
  sessionId?: string
  hasViewedResults: boolean
  hasWatchedFilm: boolean
  completedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

const QuizResultSchema = new Schema<IQuizResult>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    archetype: {
      type: String,
      enum: ["Avoider", "Gambler", "Realist", "Architect"],
      required: true,
    },
    score: { type: Number, required: true },
    answers: {
      responses: { type: Schema.Types.Mixed },
      scores: { type: Schema.Types.Mixed },
      totalQuestions: Number,
      completedAt: String,
    },
    sessionId: { type: String },
    hasViewedResults: { type: Boolean, default: false },
    hasWatchedFilm: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const QuizResultModel: Model<IQuizResult> =
  mongoose.models?.QuizResult || mongoose.model<IQuizResult>("QuizResult", QuizResultSchema)

export default QuizResultModel

