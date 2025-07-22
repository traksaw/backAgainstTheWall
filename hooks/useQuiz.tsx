"use client"

import { useState, useEffect } from "react"
import { QuizService } from "@/lib/quiz"
import { useAuth } from "./useAuth"
import type { QuizResult } from "@/lib/supabase"

export function useQuiz() {
  const { user } = useAuth()
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [latestResult, setLatestResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchQuizResults()
    }
  }, [user])

  const fetchQuizResults = async () => {
    if (!user) return

    setLoading(true)
    try {
      const results = await QuizService.getUserQuizResults(user.id)
      setQuizResults(results)
      setLatestResult(results[0] || null) // assuming latest result is first
    } catch (error) {
      console.error("Error loading quiz results:", error)
      setQuizResults([])
      setLatestResult(null)
    } finally {
      setLoading(false)
    }
  }

  const submitQuiz = async (answers: Record<number, any>, sessionId?: string) => {
    if (!user) throw new Error("User not authenticated")

    setLoading(true)
    try {
      const result = await QuizService.submitQuiz({ answers, sessionId })
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

  const updateQuizResult = async (resultId: string, updates: Partial<QuizResult>) => {
    setLoading(true)
    try {
      const updatedResult = await QuizService.updateQuizResult(resultId, updates)

      setQuizResults((prev) =>
        prev.map((result) => (result.id === resultId ? updatedResult : result))
      )

      if (latestResult?.id === resultId) {
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
