// components/quiz/QuizModal.tsx - FIXED VERSION

"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useQuizState } from "@/hooks/useQuizState"
import { useQuizLogic } from "@/hooks/useQuizLogic"
import { useQuiz } from "@/hooks/useQuiz"
import type { QuizAnswer } from "@/types/quiz"

interface QuizModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuizComplete: (quizData: any) => void
  profile: any
}

export function QuizModal({ open, onOpenChange, onQuizComplete, profile }: QuizModalProps) {
  const quizState = useQuizState()
  const quizLogic = useQuizLogic()
  const { loading: quizLoading } = useQuiz()

  const {
    currentQuestion,
    shuffledQuestions,
    showWelcome,
    answers,
    startQuiz,
    handleQuizAnswer,
  } = quizState

  const handleAnswerClick = async (answer: QuizAnswer, event: React.MouseEvent<HTMLButtonElement>) => {
    console.log("=== QUIZ MODAL: ANSWER CLICKED ===")
    console.log("Answer:", answer)
    console.log("Current question:", currentQuestion)
    console.log("🎯 Answer clicked:", answer)
    
    // Immediately blur the button to prevent focus persistence on mobile
    const target = event.currentTarget
    setTimeout(() => {
      target.blur()
      // Also remove focus from any other buttons
      document.querySelectorAll('button').forEach(btn => btn.blur())
    }, 100)
    
    // Add visual feedback - highlight the selected answer briefly
    target.style.backgroundColor = '#B95D38'
    target.style.color = 'white'
    target.style.borderColor = '#B95D38'
    
    // 🔧 FIX: Build final answers BEFORE calling handleQuizAnswer
    const finalAnswers = { ...answers, [currentQuestion]: answer }
    
    console.log("🔍 Final answers being submitted:", {
      count: Object.keys(finalAnswers).length,
      answers: finalAnswers,
      lastAnswer: answer
    });
    
    // Validate each answer has required fields
    console.log("🔍 Answer validation:", Object.entries(finalAnswers).map(([key, ans]) => ({
      question: key,
      text: ans?.text,
      archetype: ans?.archetype,
      points: ans?.points,
      isValid: !!(ans?.archetype && typeof ans?.points === 'number')
    })));
    
    // Add a brief delay for better UX before progressing
    setTimeout(() => {
      const isComplete = handleQuizAnswer(answer)
      console.log("Is quiz complete:", isComplete)
      
      if (isComplete) {
        try {
          console.log("🎯 Quiz completed! Processing submission...")
          
          // 🔧 FIX: Use the finalAnswers we built above (not state)
          console.log("Final answers for submission:", {
            count: Object.keys(finalAnswers).length,
            answers: finalAnswers
          })
          
          // 🔧 FIX: Pass raw answers, let useQuizHandlers do the processing
          console.log("🎯 Calling onQuizComplete with raw answers...")
          onQuizComplete(finalAnswers)
          console.log("✅ onQuizComplete finished successfully")
          
        } catch (error) {
          console.error('=== QUIZ MODAL: COMPLETION ERROR ===')
          console.error('Error details:', error)
          console.error('Error stack:', (error as Error)?.stack)
          alert(`Quiz completion failed: ${(error as any)?.message || 'Unknown error'}`)
        }
      } else {
        console.log("Quiz not complete yet, automatically advancing to next question...")
      }
    }, 600) // 600ms delay for visual feedback
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
                    className="w-full text-left justify-start p-4 sm:p-6 h-auto border-gray-300 hover:border-[#B95D38] hover:bg-[#B95D38]/10 transition-all duration-300 rounded-lg text-wrap min-h-[56px] sm:min-h-[auto] focus:outline-none focus:ring-0"
                  >
                    <span className="text-sm sm:text-base text-gray-700 leading-relaxed">{option.text}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}