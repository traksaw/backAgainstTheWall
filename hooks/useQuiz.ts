// Make sure your hooks/useQuiz.ts has this structure:

"use client"

import { useState, useEffect } from "react"
import { QuizService } from "@/lib/quiz"
import { useAuth } from "@/hooks/useAuth"
import type { IQuizResult } from "@/models/QuizResult"

export function useQuiz() {
  const { user } = useAuth()
  const [quizResults, setQuizResults] = useState<IQuizResult[]>([])
  const [latestResult, setLatestResult] = useState<IQuizResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?._id) {
      fetchQuizResults()
    } else {
      // Clear results when user logs out
      setQuizResults([])
      setLatestResult(null)
      setLoading(false)
    }
  }, [user?._id])

  const fetchQuizResults = async () => {
    if (!user?._id) return

    setLoading(true)
    try {
      console.log("📊 Fetching quiz results for user:", user._id)
      const results = await QuizService.getUserQuizResults()
      console.log("✅ Quiz results fetched:", results.length, "results")
      
      setQuizResults(results)
      setLatestResult(results[0] || null)
      
      if (results[0]) {
        console.log("📈 Latest result:", {
          id: results[0]._id,
          archetype: results[0].archetype,
          score: results[0].score,
          hasViewedResults: results[0].hasViewedResults,
          hasWatchedFilm: results[0].hasWatchedFilm
        })
      }
    } catch (error) {
      console.error("Error loading quiz results:", error)
      setQuizResults([])
      setLatestResult(null)
    } finally {
      setLoading(false)
    }
  }

  const submitQuiz = async (answers: Record<number, any>, sessionId?: string) => {
    if (!user?._id) throw new Error("User not authenticated")

    console.log("=== QUIZ SUBMISSION START ===")
    console.log("Answers to submit:", Object.keys(answers).length)

    const scores = { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 }
    Object.values(answers).forEach((answer) => {
      if (answer.archetype && answer.points) {
        scores[answer.archetype as keyof typeof scores] += answer.points
      }
    })

    const topArchetype = Object.entries(scores).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0] as keyof typeof scores

    console.log("Calculated scores:", scores)
    console.log("Winning archetype:", topArchetype)

    setLoading(true)
    try {
      const result = await QuizService.submitQuiz({
        archetype: topArchetype,
        score: scores[topArchetype],
        answers,
        sessionId,
      })
      
      console.log("✅ Quiz submitted successfully:", result)
      
      // Update local state immediately
      setLatestResult(result)
      setQuizResults((prev) => [result, ...prev])
      
      return result
    } catch (error) {
      console.error("Error submitting quiz:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateQuizResult = async (
    resultId: string,
    updates: Partial<IQuizResult>
  ) => {
    setLoading(true)
    try {
      console.log("🔄 Updating quiz result:", resultId, updates)
      
      if (!resultId) {
        throw new Error("No resultId passed to updateQuizResult")
      }

      const updatedResult = await QuizService.updateQuizResult(resultId, updates)
      console.log("✅ Quiz result updated:", updatedResult)

      setQuizResults((prev) =>
        prev.map((result) =>
          result._id.toString() === resultId ? updatedResult : result
        )
      )

      if (latestResult?._id.toString() === resultId) {
        setLatestResult(updatedResult)
      }

      return updatedResult
    } catch (error) {
      console.error("Error updating quiz result:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    quizResults,
    latestResult,
    loading,
    submitQuiz,
    updateQuizResult,
    refreshResults: fetchQuizResults, // Make sure this is exposed
  }
}