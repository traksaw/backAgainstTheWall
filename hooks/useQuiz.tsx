"use client"

import { useState, useEffect } from "react"
import { QuizService } from "@/lib/quiz"
import { useAuth } from "./useAuth"
import type { QuizResult } from "@/lib/supabase"

export function useQuiz() {
  const { user } = useAuth()
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [latestResult, setLatestResult] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadQuizResults()
    }
  }, [user])

  const loadQuizResults: () => Promise<void> = async () => {
    if (!user) return

    setLoading(true)
    try {
      const [rawResults, latestRaw] = await Promise.all([
        QuizService.getUserQuizResults(user.id),
        QuizService.getLatestQuizResult(user.id),
      ])

      const parseAnswers = (result: QuizResult): QuizResult => ({
        ...result,
        answers:
          typeof result.answers === "string"
            ? JSON.parse(result.answers)
            : result.answers,
      })

      const results = rawResults.map(parseAnswers)
      const latest = latestRaw ? parseAnswers(latestRaw) : null


      setQuizResults(results)
      setLatestResult(latest)
    } catch (error) {
      console.error("Error loading quiz results:", error)
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

      // Update local state
      setQuizResults((prev) => prev.map((result) => (result.id === resultId ? updatedResult : result)))

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
    refreshResults: loadQuizResults,
  }
}
