// components/home/useHomeController.ts
"use client"

import { useState } from "react"
import { useQuiz } from "@/hooks/useQuiz"
import { useQuizLogic } from "@/hooks/useQuizLogic"

export function useHomeController() {
  const { loading: quizLoading } = useQuiz()

  const [showSignup, setShowSignup] = useState(false)
  const [showSignin, setShowSignin] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showFilm, setShowFilm] = useState(false)
  const [showQuizHistory, setShowQuizHistory] = useState(false)

  const [quizSession, setQuizSession] = useState(0)
  const [autoResetQuiz, setAutoResetQuiz] = useState(false)

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

  return {
    showSignup, showSignin, showQuiz, showResults, showFilm, showQuizHistory,
    setShowQuiz, setShowResults, setShowFilm, setShowQuizHistory,
    quizSession, autoResetQuiz, quizLoading,
    openSignup, openSignin, openQuizHistory, closeAllModals,
    switchToSignIn, switchToSignUp, signupSucceeded,
    startQuiz, retakeQuiz,
  }
}
