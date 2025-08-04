// lib/quiz.ts

export type Archetype = "Avoider" | "Gambler" | "Realist" | "Architect"

export interface QuizAnswer {
  id: number
  archetype: Archetype
  points: number
  text: string
  questionId?: number | string
  question?: string
  answer?: string
}

export class QuizService {
  static async getUserQuizResults(): Promise<any[]> {
    const res = await fetch("/api/quiz/results", {
      credentials: "include",
    })

    if (!res.ok) throw new Error("Failed to fetch results")
    return await res.json()
  }

  static async submitQuiz(data: {
    answers: Record<number, any>
    sessionId?: string
    archetype: string
    score: number
  }): Promise<any> {
    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error("Quiz submission error:", errorData)
      throw new Error(errorData?.error || "Failed to submit quiz")
    }

    return await res.json() 
  }


  static async updateQuizResult(resultId: string, updates: any): Promise<any> {
    const res = await fetch(`/api/quiz/${resultId}/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
      credentials: "include",
    })
    console.log("resultId passed to QuizService.updateQuizResult:", resultId)


    if (!res.ok) throw new Error("Failed to update quiz result")
    return await res.json()
  }

}
