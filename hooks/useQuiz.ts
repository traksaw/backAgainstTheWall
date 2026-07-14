// Make sure your hooks/useQuiz.ts has this structure:

"use client"

import { useState, useEffect, useCallback } from "react"
import { QuizService, type QuizResult } from "@/lib/quiz"
import { useAuth } from "@/hooks/useAuth"
import type { QuizSubmissionData } from "@/types/quiz"

export function useQuiz() {
  const { user } = useAuth()
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [latestResult, setLatestResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [prevUserId, setPrevUserId] = useState(user?._id)

  // Clear results when the logged-in user changes (e.g. logout), adjusted
  // during render per https://react.dev/learn/you-might-not-need-an-effect
  // rather than in an Effect, since it's derived state, not a side effect.
  if (user?._id !== prevUserId) {
    setPrevUserId(user?._id)
    if (!user?._id) {
      setQuizResults([])
      setLatestResult(null)
      setLoading(false)
    }
  }

  const fetchQuizResults = useCallback(async () => {
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
  }, [user?._id])

  useEffect(() => {
    if (user?._id) {
      // Legitimate data-fetch Effect; fetchQuizResults sets loading=true
      // synchronously before its first await so the UI reflects an
      // in-flight refetch immediately, which trips this heuristic.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchQuizResults()
    }
  }, [user?._id, fetchQuizResults])

  const submitQuiz = async (quizData: QuizSubmissionData) => {
    if (!user?._id) throw new Error("User not authenticated")

    setLoading(true)
    try {
      const result = await QuizService.submitQuiz(quizData)
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
    updates: Partial<QuizResult>
  ) => {
    setLoading(true)
    try {
      
      if (!resultId) {
        throw new Error("No resultId passed to updateQuizResult")
      }

      const updatedResult = await QuizService.updateQuizResult(resultId, updates)

      setQuizResults((prev) =>
        prev.map((result) =>
          (result._id || result.id)?.toString() === resultId ? updatedResult : result
        )
      )

      if ((latestResult?._id || latestResult?.id)?.toString() === resultId) {
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