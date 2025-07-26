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
    }
  }, [user?._id])

  const fetchQuizResults = async () => {
    if (!user?._id) return

    setLoading(true)
    try {
      const results = await QuizService.getUserQuizResults()
      setQuizResults(results)
      setLatestResult(results[0] || null)
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

    const scores = { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 }
    Object.values(answers).forEach((answer) => {
      scores[answer.archetype as keyof typeof scores] += answer.points
    })

    const topArchetype = Object.entries(scores).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0] as keyof typeof scores

    setLoading(true)
    try {
      const result = await QuizService.submitQuiz({
        archetype: topArchetype,
        score: scores[topArchetype],
        answers,
        sessionId,
      })
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
      console.log("Updating quiz result with ID:", resultId, "Updates:", updates)
      if (!resultId) {
        throw new Error("No resultId passed to updateQuizResult")
      }

      const updatedResult = await QuizService.updateQuizResult(resultId, updates)

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
    refreshResults: fetchQuizResults,
  }
}

export async function fetchQuizResultsFromApi() {
  const res = await fetch("/api/quiz/results", {
    credentials: "include",
  })
  if (!res.ok) throw new Error("Failed to fetch quiz results")
  return await res.json()
}
