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
    console.log('=== QUIZ SERVICE DEBUG ===')
    console.log('Data being sent to API:', JSON.stringify(data, null, 2))

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      })

      console.log('Response status:', res.status)
      console.log('Response ok:', res.ok)
      console.log('Response headers:', Object.fromEntries(res.headers.entries()))

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
      console.log('Quiz submission successful:', responseData)
      return responseData

    } catch (error) {
      console.error('Quiz submission fetch error:', error)
      throw error
    }
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
