// components/quiz/QuizModal.tsx - FIXED VERSION

"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useQuizState } from "@/hooks/useQuizState"
import { useEffect, useMemo, useRef, useState } from "react"
import type { QuizAnswer } from "@/types/quiz"
import { logger } from "@/lib/logger"

interface UserProfile {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
}
// Removed micro-toast for a more minimal flow

interface QuizModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuizComplete: (answers: Record<number, QuizAnswer>, sessionId: string) => void
  profile: UserProfile
  // When true, the quiz will hard reset upon opening (but not auto-start), so welcome screen stays
  autoReset?: boolean
  quizLoading: boolean
}

export function QuizModal({ open, onOpenChange, onQuizComplete, profile, autoReset = false, quizLoading }: QuizModalProps) {
  const quizState = useQuizState()

  const {
    currentQuestion,
    shuffledQuestions,
    sessionId,
    showWelcome,
    answers,
    startQuiz,
    hardReset,
    handleQuizAnswer,
    goBackOne,
    isStarting,
    startError,
  } = quizState

  // Ensure no button remains focused when moving to the next question (mobile Safari focus persistence)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const active = document.activeElement as HTMLElement | null
    if (active && (active.tagName === 'BUTTON' || active.tabIndex >= 0)) {
      active.blur()
    }
  }, [currentQuestion])

  // Guards the 100ms answer-confirmation delay so a rapid second click can't register a duplicate answer.
  // The ref is checked/set synchronously so two clicks arriving before a re-render still can't both pass the
  // guard; the state value only drives the `disabled` prop for the UI.
  const isAnsweringRef = useRef(false)
  const [isAnswering, setIsAnswering] = useState(false)
  const stopAnswering = () => {
    isAnsweringRef.current = false
    setIsAnswering(false)
  }
  useEffect(() => {
    // stopAnswering mutates isAnsweringRef (a real ref) in addition to
    // setting state, so it can't move to a render-time adjustment - ref
    // mutation during render is itself unsafe. This resets an imperative
    // guard (WAS-27 double-click-race fix), not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    stopAnswering()
    // Also depend on showWelcome: hardReset() can return currentQuestion to a value it already
    // held (e.g. 0), which wouldn't otherwise re-trigger this effect and clear a pending guard.
  }, [currentQuestion, showWelcome])

  // Radix unmounts DialogContent's subtree when `open` goes false without unmounting QuizModal
  // itself, so a pending confirmation must check this ref (not just component-mount state) to
  // notice the dialog was dismissed mid-delay.
  const openRef = useRef(open)
  useEffect(() => {
    openRef.current = open
  }, [open])

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Auto-reset logic: when modal transitions closed -> open and autoReset is true,
  // perform a hard reset so state is clean and welcome screen is shown.
  // A real useRef (not useMemo) so mutating .current is well-defined -
  // useMemo's return value isn't guaranteed stable/mutable the way a ref is.
  const lastOpenRef = useRef(false)
  useEffect(() => {
    const wasOpen = lastOpenRef.current
    if (!wasOpen && open && autoReset) {
      // Closed -> Open with autoReset enabled
      hardReset()
    }
    lastOpenRef.current = open
  }, [open, autoReset, hardReset])

  // Option B: progress and live announcements
  const [liveMessage, setLiveMessage] = useState("")
  const totalQuestions = shuffledQuestions.length
  const progressPct = useMemo(() => {
    if (totalQuestions === 0) return 0
    // Progress shows current question index out of total
    return Math.round(((currentQuestion) / totalQuestions) * 100)
  }, [currentQuestion, totalQuestions])
  // Clear any previous announcement on question change. Adjusted during
  // render per https://react.dev/learn/you-might-not-need-an-effect since
  // liveMessage is also set imperatively elsewhere (answer/back handlers).
  const [prevQuestionForMessage, setPrevQuestionForMessage] = useState(currentQuestion)
  if (currentQuestion !== prevQuestionForMessage) {
    setPrevQuestionForMessage(currentQuestion)
    setLiveMessage("")
  }

  // Roving tabindex for the option radiogroup: only one option is ever
  // reachable via Tab; arrow keys move both focus and the tab stop.
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(0)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  // Reset the roving tab stop when the question changes, adjusted during render
  // (see prevQuestionForMessage below) rather than in an effect.
  const [prevQuestionForFocus, setPrevQuestionForFocus] = useState(currentQuestion)
  if (currentQuestion !== prevQuestionForFocus) {
    setPrevQuestionForFocus(currentQuestion)
    setFocusedOptionIndex(0)
  }

  const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, optionCount: number) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    // Read the current index from the focused element rather than state: state only tracks
    // moves made via these arrow-key handlers, so a focus change from elsewhere (e.g. a test
    // calling .focus() directly, or an option regaining focus after being re-enabled) would
    // otherwise desync from where focus actually is.
    const currentIndex = optionRefs.current.indexOf(event.currentTarget)
    const direction = event.key === 'ArrowDown' ? 1 : -1
    const nextIndex = (currentIndex + direction + optionCount) % optionCount
    setFocusedOptionIndex(nextIndex)
    optionRefs.current[nextIndex]?.focus()
  }

  const handleAnswerClick = async (answer: QuizAnswer, event: React.MouseEvent<HTMLButtonElement>) => {
    if (isAnsweringRef.current) return
    isAnsweringRef.current = true
    setIsAnswering(true)

    // Immediately blur the button to prevent focus persistence on mobile
    const target = event.currentTarget
    if (target) {
      target.blur()
    }

    // Add a small delay to allow the button animation to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // The dialog may have been dismissed (or the component unmounted) while this delay was
    // pending — don't record an answer or fire completion for a quiz the user already left.
    if (!isMountedRef.current) return
    if (!openRef.current) {
      stopAnswering()
      return
    }

    // Build final answers BEFORE calling handleQuizAnswer
    const finalAnswers = { ...answers, [currentQuestion]: answer }

    // Announce selection and next step (for screen readers and subtle UX clarity)
    const isLast = currentQuestion >= totalQuestions - 1
    setLiveMessage(isLast
      ? "Answer selected. Finishing quiz."
      : `Answer selected. Moving to question ${currentQuestion + 2} of ${totalQuestions}.`)

    // Advance immediately (no extra animation/delay)
    const isComplete = handleQuizAnswer(answer)

    if (isComplete) {
      try {
        if (!sessionId) {
          throw new Error('Missing quiz session — please start the quiz again')
        }
        onQuizComplete(finalAnswers, sessionId)
      } catch (error) {
        logger.error('Quiz completion error in modal:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        alert(`Quiz completion failed: ${errorMessage}`)
      } finally {
        // Last question never triggers the currentQuestion-change reset above, so without this,
        // a failed completion would leave the options permanently disabled with no way to retry.
        stopAnswering()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg bg-white text-gray-900 border-0 p-0 rounded-2xl shadow-2xl">
        <div className="max-h-[85vh] overflow-y-auto app-pad-lg p-4" tabIndex={0} style={{ WebkitOverflowScrolling: 'touch' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-gray-900 p-2">
              Financial Mindset Quiz
            </DialogTitle>
            <DialogDescription className="sr-only">
              Answer multiple-choice questions to determine your financial archetype. Use the buttons to select an answer and proceed.
            </DialogDescription>
            
            {/* Welcome Screen */}
            {showWelcome && profile && (
              <div className="space-y-5 py-5">
                <div className="text-center space-y-3">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Welcome! Let's discover your financial personality.
                  </p>
                  <p className="text-sm text-gray-600">
                    Your responses will reveal your financial archetype and help you connect more deeply with the film's
                    characters.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  {startError && (
                    <p className="text-sm text-red-600 text-center" role="alert">
                      {startError}
                    </p>
                  )}
                  <Button
                    onClick={() => void startQuiz()}
                    disabled={isStarting}
                    className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold px-6 py-3 rounded-lg text-sm min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B95D38] focus-visible:ring-offset-2 disabled:opacity-50"
                  >
                    {isStarting ? "Starting…" : "Start Quiz"}
                  </Button>
                </div>
              </div>
            )}
          </DialogHeader>

          {/* Progress Bar */}
          {!showWelcome && totalQuestions > 0 && (
            <div className="pt-3" role="status" aria-live="polite">
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
            <div className="space-y-7 py-5">
              {/* Progress indicator */}
              <div className="text-center text-xs text-gray-500">
                Question {currentQuestion + 1} of {shuffledQuestions.length}
              </div>
              
              <h3 id="quiz-question-heading" className="text-lg font-semibold text-center text-gray-800 leading-relaxed">
                {shuffledQuestions[currentQuestion]?.question || shuffledQuestions[currentQuestion]?.text}
              </h3>
              <div role="radiogroup" aria-labelledby="quiz-question-heading" className="space-y-3">
                {shuffledQuestions[currentQuestion]?.options.map((option: QuizAnswer, index: number) => {
                  // Create a unique key that includes the current question to force re-render
                  const uniqueKey = `${currentQuestion}-${option.id || index}-${option.text.slice(0, 10)}`;
                  const optionCount = shuffledQuestions[currentQuestion]?.options.length ?? 0;

                  return (
                    <Button
                      key={uniqueKey}
                      ref={(el) => { optionRefs.current[index] = el; }}
                      role="radio"
                      aria-checked={false}
                      tabIndex={index === focusedOptionIndex ? 0 : -1}
                      variant="outline"
                      onClick={(event) => handleAnswerClick(option, event)}
                      onKeyDown={(event) => handleOptionKeyDown(event, optionCount)}
                      disabled={quizLoading || isAnswering}
                      className="w-full text-left justify-start p-4 h-auto border-gray-300 hover:border-gray-300 hover:bg-transparent active:bg-transparent active:border-gray-300 transition-none rounded-lg text-wrap min-h-[56px] focus:outline focus-visible:ring-2 focus-visible:ring-[#B95D38] focus-visible:ring-offset-2"
                    >
                      <span className="text-sm text-gray-700 leading-relaxed">{option.text}</span>
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
                    disabled={isAnswering}
                    className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B95D38] focus-visible:ring-offset-2 min-h-[44px] px-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}