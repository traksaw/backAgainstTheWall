import { Schema, Document, Model } from "mongoose"
import mongoose from "mongoose"
import type { QuizQuestion } from "@/types/quiz"

export type QuizAttemptStatus = "in_progress" | "completed" | "expired"

export interface IQuizAttempt extends Document {
  userId: mongoose.Types.ObjectId
  sessionId: string
  layout: QuizQuestion[]
  status: QuizAttemptStatus
  expiresAt: Date
  createdAt?: Date
  updatedAt?: Date
}

const QuizOptionSchema = new Schema(
  {
    id: Number,
    text: { type: String, required: true },
    question: String,
    archetype: {
      type: String,
      enum: ["Avoider", "Gambler", "Realist", "Architect"],
      required: true,
    },
    points: { type: Number, required: true },
  },
  { _id: false }
)

const QuizQuestionSchema = new Schema(
  {
    id: { type: Number, required: true },
    text: { type: String, required: true },
    question: String,
    options: { type: [QuizOptionSchema], required: true },
  },
  { _id: false }
)

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    sessionId: { type: String, required: true, unique: true },
    layout: { type: [QuizQuestionSchema], required: true },
    status: {
      type: String,
      enum: ["in_progress", "completed", "expired"],
      required: true,
      default: "in_progress",
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
)

QuizAttemptSchema.index({ userId: 1, sessionId: 1 })
// TTL: MongoDB removes the doc once expiresAt is in the past
QuizAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const QuizAttemptModel: Model<IQuizAttempt> =
  mongoose.models?.QuizAttempt ||
  mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema)

export default QuizAttemptModel
