// components/home/useHomeController.ts
"use client"

import { useState } from "react"
import { useQuiz } from "@/hooks/useQuiz"
import { useQuizLogic } from "@/hooks/useQuizLogic"
import type { QuizAnswer, QuizResult } from "@/types/quiz"

function reconcileLatestResult(
  serverResult: QuizResult | null,
  optimisticResult: QuizResult | null
): QuizResult | null {
  if (serverResult && optimisticResult && serverResult.sessionId === optimisticResult.sessionId) {
    // Prefer the server result (real `_id`, persisted `hasViewedResults`/`hasWatchedFilm`,
    // etc.) but never let it silently blank out fields the API doesn't actually echo back.
    // None of app/api/quiz/{submit,[id]/update,results} return a top-level `scores`, and
    // the server's `answers` (when present) is a differently-shaped internal record
    // ({responses, scores, totalQuestions, completedAt}), not this frontend's
    // Record<number, QuizAnswer> — so both fall back to the optimistic value, which was
    // computed correctly and synchronously on the client.
    return {
      ...optimisticResult,
      ...serverResult,
      scores: serverResult.scores ?? optimisticResult.scores,
      answers: serverResult.answers ?? optimisticResult.answers,
    }
  }
  return optimisticResult ?? serverResult
}

export function useHomeController() {
  const { latestResult: serverLatestResult, loading: quizLoading, submitQuiz, updateQuizResult } = useQuiz()
  const quizLogic = useQuizLogic()

  const [showSignup, setShowSignup] = useState(false)
  const [showSignin, setShowSignin] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showFilm, setShowFilm] = useState(false)
  const [showQuizHistory, setShowQuizHistory] = useState(false)

  const [quizSession, setQuizSession] = useState(0)
  const [autoResetQuiz, setAutoResetQuiz] = useState(false)
  const [optimisticResult, setOptimisticResult] = useState<QuizResult | null>(null)

  const closeAllModals = () => {
    setShowSignup(false)
    setShowSignin(false)
    setShowQuiz(false)
    setShowResults(false)
    setShowFilm(false)
    setShowQuizHistory(false)
  }

  const openSignup = () => { closeAllModals(); setShowSignup(true) }
  const openSignin = () => { closeAllModals(); setShowSignin(true) }
  const openQuizHistory = () => { closeAllModals(); setShowQuizHistory(true) }
  const switchToSignIn = () => { setShowSignup(false); setShowSignin(true) }
  const switchToSignUp = () => { setShowSignin(false); setShowSignup(true) }

  const startQuiz = () => {
    setQuizSession((s) => s + 1)
    setTimeout(() => {
      closeAllModals()
      setShowQuiz(true)
    }, 50)
  }

  const retakeQuiz = () => {
    closeAllModals()
    setOptimisticResult(null)
    setQuizSession((s) => s + 1)
    setTimeout(() => {
      setAutoResetQuiz(true)
      setShowQuiz(true)
    }, 150)
  }

  const signupSucceeded = () => {
    setShowSignup(false)
    setTimeout(() => {
      startQuiz()
    }, 100)
  }

  const completeQuiz = async (answers: Record<number, QuizAnswer>) => {
    try {
      const quizData = quizLogic.processQuizCompletion(answers)

      const optimistic: QuizResult = {
        archetype: quizData.archetype,
        score: quizData.score,
        scores: quizData.scores,
        answers: quizData.answers,
        sessionId: quizData.sessionId,
        createdAt: new Date().toISOString(),
        hasViewedResults: false,
        hasWatchedFilm: false,
      }

      setShowQuiz(false)
      setOptimisticResult(optimistic)
      setTimeout(() => {
        setShowResults(true)
      }, 300)

      try {
        await submitQuiz(quizData)
      } catch (error) {
        console.warn('Backend submission failed, but results are shown optimistically:', error)
      }
    } catch (error) {
      console.error('Quiz completion error:', error)
      setShowQuiz(false)
      alert(`Quiz failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const latestResult = reconcileLatestResult(serverLatestResult, optimisticResult)

  const viewResults = async () => {
    if (latestResult && !latestResult.hasViewedResults) {
      const resultId = latestResult._id
      if (!resultId) {
        console.error('No valid ID found in latestResult:', latestResult)
      } else {
        try {
          await updateQuizResult(resultId, { hasViewedResults: true })
        } catch (error) {
          console.warn('Failed to update results viewed:', error)
        }
      }
    }
    setShowResults(false)
    setShowFilm(true)
  }

  const completeFilm = async () => {
    if (latestResult && !latestResult.hasWatchedFilm) {
      const resultId = latestResult._id
      if (!resultId) {
        console.error('No valid ID found in latestResult:', latestResult)
      } else {
        try {
          await updateQuizResult(resultId, { hasWatchedFilm: true })
        } catch (error) {
          console.warn('Failed to update film watched:', error)
        }
      }
    }
    setShowFilm(false)
  }

  const handleVideoError = (error: string) => {
    console.error('Video playback error:', error)
  }

  return {
    showSignup, showSignin, showQuiz, showResults, showFilm, showQuizHistory,
    setShowQuiz, setShowResults, setShowFilm, setShowQuizHistory,
    quizSession, autoResetQuiz, latestResult, quizLoading,
    openSignup, openSignin, openQuizHistory, closeAllModals,
    switchToSignIn, switchToSignUp, signupSucceeded,
    startQuiz, retakeQuiz, completeQuiz, viewResults, completeFilm, handleVideoError,
  }
}
