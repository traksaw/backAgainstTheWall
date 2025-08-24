// components/quiz/QuizModal.tsx - FIXED VERSION

"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useQuizState } from "@/hooks/useQuizState"
import { useQuizLogic } from "@/hooks/useQuizLogic"
import { useQuiz } from "@/hooks/useQuiz"
import type { QuizAnswer } from "@/types/quiz"
import { useEffect, useMemo, useState } from "react"
// Removed micro-toast for a more minimal flow

interface QuizModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuizComplete: (quizData: any) => void
  profile: any
  // When true, the quiz will hard reset upon opening (but not auto-start), so welcome screen stays
  autoReset?: boolean
}

export function QuizModal({ open, onOpenChange, onQuizComplete, profile, autoReset = false }: QuizModalProps) {
  const quizState = useQuizState()
  const quizLogic = useQuizLogic()
  const { loading: quizLoading } = useQuiz()

  const {
    currentQuestion,
    shuffledQuestions,
    showWelcome,
    answers,
    startQuiz,
    hardReset,
    handleQuizAnswer,
    goBackOne,
  } = quizState

  // Ensure no button remains focused when moving to the next question (mobile Safari focus persistence)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const active = document.activeElement as HTMLElement | null
    if (active && (active.tagName === 'BUTTON' || active.tabIndex >= 0)) {
      active.blur()
    }
  }, [currentQuestion])

  // Auto-reset logic: when modal transitions closed -> open and autoReset is true,
  // perform a hard reset so state is clean and welcome screen is shown.
  const lastOpenRef = useMemo(() => ({ current: false }), []) as { current: boolean }
  useEffect(() => {
    const wasOpen = lastOpenRef.current
    if (!wasOpen && open && autoReset) {
      // Closed -> Open with autoReset enabled
      hardReset()
    }
    lastOpenRef.current = open
  }, [open, autoReset, hardReset, lastOpenRef])

  // Option B: progress and live announcements
  const [liveMessage, setLiveMessage] = useState("")
  const totalQuestions = shuffledQuestions.length
  const progressPct = useMemo(() => {
    if (totalQuestions === 0) return 0
    // Progress shows current question index out of total
    return Math.round(((currentQuestion) / totalQuestions) * 100)
  }, [currentQuestion, totalQuestions])
  useEffect(() => {
    // Clear any previous announcement on question change
    setLiveMessage("")
  }, [currentQuestion])

  const handleAnswerClick = async (answer: QuizAnswer, event: React.MouseEvent<HTMLButtonElement>) => {
    console.log("=== QUIZ MODAL: ANSWER CLICKED ===")
    console.log("Answer:", answer)
    console.log("Current question:", currentQuestion)

    // Immediately blur the button to prevent focus persistence on mobile
    const target = event.currentTarget
    target.blur()
    // Also remove focus from any other buttons
    document.querySelectorAll('button').forEach(btn => btn.blur())

    // Build final answers BEFORE calling handleQuizAnswer
    const finalAnswers = { ...answers, [currentQuestion]: answer }

    // Announce selection and next step (for screen readers and subtle UX clarity)
    const isLast = currentQuestion >= totalQuestions - 1
    setLiveMessage(isLast
      ? "Answer selected. Finishing quiz."
      : `Answer selected. Moving to question ${currentQuestion + 2} of ${totalQuestions}.`)

    // No visual toast to keep interaction seamless/minimal

    // Advance immediately (no extra animation/delay)
    const isComplete = handleQuizAnswer(answer)
    console.log("Is quiz complete:", isComplete)

    if (isComplete) {
      try {
        onQuizComplete(finalAnswers)
      } catch (error) {
        console.error('=== QUIZ MODAL: COMPLETION ERROR ===')
        console.error('Error details:', error)
        console.error('Error stack:', (error as Error)?.stack)
        alert(`Quiz completion failed: ${(error as any)?.message || 'Unknown error'}`)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl bg-white text-gray-900 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-center text-gray-900 px-2">
            Financial Mindset Quiz
          </DialogTitle>
          
          {/* Welcome Screen */}
          {showWelcome && profile && (
            <div className="space-y-4 sm:space-y-6 py-4 sm:py-6 px-2">
              <div className="text-center space-y-3 sm:space-y-4">
                <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
                  Welcome! Let's discover your financial personality.
                </p>
                <p className="text-sm sm:text-base text-gray-600">
                  Your responses will reveal your financial archetype and help you connect more deeply with the film's
                  characters.
                </p>
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    console.log("🎯 Starting quiz...")
                    startQuiz()
                  }}
                  className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold px-6 sm:px-8 py-3 rounded-lg text-sm sm:text-base min-h-[44px]"
                >
                  Start Quiz
                </Button>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Progress Bar */}
        {!showWelcome && totalQuestions > 0 && (
          <div className="px-2 pt-2">
            <div className="h-1.5 w-full bg-gray-200 rounded">
              <div
                className="h-1.5 bg-[#B95D38] rounded transition-[width] duration-300 ease-out"
                style={{ width: `${progressPct}%` }}
                aria-hidden="true"
              />
            </div>
            <div className="sr-only" aria-live="polite">
              {`Progress: Question ${currentQuestion + 1} of ${totalQuestions}`}
            </div>
          </div>
        )}

        {/* Screen reader announcement region */}
        <div className="sr-only" aria-live="polite">{liveMessage}</div>

        {/* Quiz Questions */}
        {!showWelcome && shuffledQuestions.length > 0 && currentQuestion < shuffledQuestions.length && (
          <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 px-2">
            {/* Progress indicator */}
            <div className="text-center text-xs sm:text-sm text-gray-500">
              Question {currentQuestion + 1} of {shuffledQuestions.length}
            </div>
            
            <h3 className="text-lg sm:text-xl font-semibold text-center text-gray-800 leading-relaxed px-2">
              {shuffledQuestions[currentQuestion]?.question || shuffledQuestions[currentQuestion]?.text}
            </h3>
            <div className="space-y-3">
              {shuffledQuestions[currentQuestion]?.options.map((option: QuizAnswer, index: number) => {
                // Create a unique key that includes the current question to force re-render
                const uniqueKey = `${currentQuestion}-${option.id || index}-${option.text.slice(0, 10)}`;
                
                return (
                  <Button
                    key={uniqueKey}
                    variant="outline"
                    onClick={(event) => handleAnswerClick(option, event)}
                    disabled={quizLoading}
                    className="w-full text-left justify-start p-4 sm:p-6 h-auto border-gray-300 hover:border-gray-300 hover:bg-transparent active:bg-transparent active:border-gray-300 transition-none rounded-lg text-wrap min-h-[56px] sm:min-h-[auto] focus:outline-none focus:ring-0 focus-visible:outline-none select-none touch-manipulation"
                  >
                    <span className="text-sm sm:text-base text-gray-700 leading-relaxed">{option.text}</span>
                  </Button>
                );
              })}
            </div>

            {/* Back action (hidden on first question) */}
            {currentQuestion > 0 && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    goBackOne()
                    setLiveMessage(`Going back to question ${currentQuestion} of ${totalQuestions}.`)
                  }}
                  className="text-xs sm:text-sm text-gray-500 underline underline-offset-2 hover:text-gray-700 focus:outline-none focus:ring-0 min-h-[44px] px-2"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}