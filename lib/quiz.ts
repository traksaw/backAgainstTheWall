// lib/quiz.ts

import type { Archetype, QuizAnswer, QuizResult } from "@/types/quiz"
export type { Archetype, QuizAnswer, QuizResult }

export interface QuizResultUpdate {
  hasViewedResults?: boolean;
  hasWatchedFilm?: boolean;
}

export class QuizService {
  static async getUserQuizResults(): Promise<QuizResult[]> {
    const res = await fetch("/api/quiz/results", {
      credentials: "include",
    })

    if (!res.ok) throw new Error("Failed to fetch results")
    return await res.json()
  }

  static async submitQuiz(data: {
    answers: Record<number, QuizAnswer>
    sessionId?: string
    archetype: string
    score: number
    scores?: Record<string, number>
  }): Promise<QuizResult> {
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      })

      if (!res.ok) {
        let errorData
        try {
          errorData = await res.json()
        } catch (jsonError) {
          console.error('Failed to parse error response as JSON:', jsonError)
          errorData = { error: `HTTP ${res.status}: ${res.statusText}` }
        }

        console.error("Quiz submission HTTP error:", {
          status: res.status,
          statusText: res.statusText,
          errorData
        })

        throw new Error(errorData?.error || `HTTP ${res.status}: ${res.statusText}`)
      }

      const responseData = await res.json()
      return responseData

    } catch (error) {
      console.error('Quiz submission fetch error:', error)
      throw error
    }
  }

  static async updateQuizResult(resultId: string, updates: QuizResultUpdate): Promise<QuizResult> {
    const res = await fetch(`/api/quiz/${resultId}/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
      credentials: "include",
    })

    if (!res.ok) throw new Error("Failed to update quiz result")
    return await res.json()
  }

}
