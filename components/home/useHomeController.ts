// components/home/useHomeController.ts
"use client"

import { useReducer, useRef, useEffect } from "react"
import { useQuiz } from "@/hooks/useQuiz"
import { useQuizLogic } from "@/hooks/useQuizLogic"
import type { QuizAnswer, QuizResult } from "@/types/quiz"
import { logger } from "@/lib/logger"

export type ModalKey = 'signup' | 'signin' | 'forgotPassword' | 'quiz' | 'results' | 'film' | 'quizHistory'
const MODAL_TRANSITION_MS = 250 // safely past DialogContent's 200ms CSS exit animation

interface ModalState {
  activeModal: ModalKey | null
  pendingModal: ModalKey | null
  quizSession: number
  autoResetQuiz: boolean
  optimisticResult: QuizResult | null
}

type ModalAction =
  | { type: 'OPEN'; modal: ModalKey }
  | { type: 'CLOSE' }
  | { type: 'CLOSE_THEN_OPEN'; modal: ModalKey }
  | { type: 'SETTLE' }
  | { type: 'QUIZ_SESSION_STARTED'; autoReset: boolean }
  | { type: 'QUIZ_COMPLETED'; result: QuizResult }

const initialState: ModalState = {
  activeModal: null,
  pendingModal: null,
  quizSession: 0,
  autoResetQuiz: false,
  optimisticResult: null,
}

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, activeModal: action.modal, pendingModal: null }
    case 'CLOSE':
      return { ...state, activeModal: null, pendingModal: null }
    case 'CLOSE_THEN_OPEN':
      return { ...state, activeModal: null, pendingModal: action.modal }
    case 'SETTLE':
      return state.pendingModal
        ? { ...state, activeModal: state.pendingModal, pendingModal: null }
        : state
    case 'QUIZ_SESSION_STARTED':
      return { ...state, quizSession: state.quizSession + 1, autoResetQuiz: action.autoReset, optimisticResult: null }
    case 'QUIZ_COMPLETED':
      return { ...state, optimisticResult: action.result }
    default:
      return state
  }
}

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
  const [state, dispatch] = useReducer(modalReducer, initialState)
  const settleTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(settleTimer.current), [])

  const closeThenOpen = (modal: ModalKey) => {
    clearTimeout(settleTimer.current)
    dispatch({ type: 'CLOSE_THEN_OPEN', modal })
    settleTimer.current = setTimeout(() => dispatch({ type: 'SETTLE' }), MODAL_TRANSITION_MS)
  }

  const openSignup = () => dispatch({ type: 'OPEN', modal: 'signup' })
  const openSignin = () => dispatch({ type: 'OPEN', modal: 'signin' })
  const openResults = () => dispatch({ type: 'OPEN', modal: 'results' })
  const openFilm = () => dispatch({ type: 'OPEN', modal: 'film' })
  const openQuizHistory = () => closeThenOpen('quizHistory')
  const closeActiveModal = () => dispatch({ type: 'CLOSE' })
  const switchToSignIn = () => dispatch({ type: 'OPEN', modal: 'signin' })
  const switchToSignUp = () => dispatch({ type: 'OPEN', modal: 'signup' })
  const switchToForgotPassword = () => dispatch({ type: 'OPEN', modal: 'forgotPassword' })

  const startQuiz = () => {
    dispatch({ type: 'QUIZ_SESSION_STARTED', autoReset: false })
    closeThenOpen('quiz')
  }

  const retakeQuiz = () => {
    dispatch({ type: 'QUIZ_SESSION_STARTED', autoReset: true })
    closeThenOpen('quiz')
  }

  const signupSucceeded = () => {
    closeThenOpen('quiz')
    dispatch({ type: 'QUIZ_SESSION_STARTED', autoReset: false })
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
      dispatch({ type: 'QUIZ_COMPLETED', result: optimistic })
      closeThenOpen('results')

      try {
        await submitQuiz(quizData)
      } catch (error) {
        logger.warn('Backend submission failed, but results are shown optimistically:', error)
      }
    } catch (error) {
      logger.error('Quiz completion error:', error)
      dispatch({ type: 'CLOSE' })
      alert(`Quiz failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const latestResult = reconcileLatestResult(serverLatestResult, state.optimisticResult)

  const viewResults = async () => {
    if (latestResult && !latestResult.hasViewedResults) {
      const resultId = latestResult._id
      if (!resultId) {
        logger.error('No valid ID found in latestResult:', latestResult)
      } else {
        try {
          await updateQuizResult(resultId, { hasViewedResults: true })
        } catch (error) {
          logger.warn('Failed to update results viewed:', error)
        }
      }
    }
    closeThenOpen('film')
  }

  const completeFilm = async () => {
    if (latestResult && !latestResult.hasWatchedFilm) {
      const resultId = latestResult._id
      if (!resultId) {
        logger.error('No valid ID found in latestResult:', latestResult)
      } else {
        try {
          await updateQuizResult(resultId, { hasWatchedFilm: true })
        } catch (error) {
          logger.warn('Failed to update film watched:', error)
        }
      }
    }
    dispatch({ type: 'CLOSE' })
  }

  const handleVideoError = (error: string) => {
    // VideoPlayer's own handleError already reports the full diagnostic
    // object to Sentry - this is just a lower-detail duplicate of the same
    // failure, so keep it dev-console-only.
    logger.warn('Video playback error:', error)
  }

  return {
    activeModal: state.activeModal,
    pendingModal: state.pendingModal,
    quizSession: state.quizSession,
    autoResetQuiz: state.autoResetQuiz,
    latestResult,
    quizLoading,
    openSignup, openSignin, openResults, openFilm, openQuizHistory, closeActiveModal,
    switchToSignIn, switchToSignUp, switchToForgotPassword, signupSucceeded,
    startQuiz, retakeQuiz, completeQuiz, viewResults, completeFilm, handleVideoError,
  }
}
