// Update your components/quiz/QuizModal.tsx

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

  const handleAnswerClick = async (answer: QuizAnswer) => {
    console.log("=== QUIZ MODAL: ANSWER CLICKED ===")
    console.log("Answer:", answer)
    console.log("Current question:", currentQuestion)
    console.log("Total questions:", shuffledQuestions.length)
    console.log("Current answers count:", Object.keys(answers).length)
    
    const isComplete = handleQuizAnswer(answer)
    console.log("Is quiz complete:", isComplete)
    
    if (isComplete) {
      try {
        console.log("🎯 Quiz completed! Processing submission...")
        
        // Get the final answers including the last answer
        const finalAnswers = { ...answers, [currentQuestion]: answer }
        console.log("Final answers for submission:", {
          count: Object.keys(finalAnswers).length,
          answers: finalAnswers
        })
        
        const quizData = quizLogic.processQuizCompletion(finalAnswers)
        console.log("Processed quiz data:", quizData)
        
        console.log("🎯 Calling onQuizComplete...")
        await onQuizComplete(quizData)
        console.log("✅ onQuizComplete finished successfully")
        
      } catch (error) {
        console.error('=== QUIZ MODAL: COMPLETION ERROR ===')
        console.error('Error details:', error)
        alert(`Quiz completion failed: ${(error as any)?.message || 'Unknown error'}`)
      }
    } else {
      console.log("Quiz not complete yet, continuing...")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white text-gray-900 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center text-gray-900">
            Financial Mindset Quiz
          </DialogTitle>
          
          {/* Welcome Screen */}
          {showWelcome && profile && (
            <div className="space-y-6 py-6">
              <div className="text-center space-y-4">
                <p className="text-xl text-gray-700 leading-relaxed">
                  Welcome! Let's discover your financial personality.
                </p>
                <p className="text-gray-600">
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
                  className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold px-8 py-3 rounded-lg"
                >
                  Start Quiz
                </Button>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Quiz Questions */}
        {!showWelcome && shuffledQuestions.length > 0 && currentQuestion < shuffledQuestions.length && (
          <div className="space-y-8 py-6">
            {/* Progress indicator */}
            <div className="text-center text-sm text-gray-500">
              Question {currentQuestion + 1} of {shuffledQuestions.length}
            </div>
            
            <h3 className="text-xl font-semibold text-center text-gray-800 leading-relaxed">
              {shuffledQuestions[currentQuestion]?.question}
            </h3>
            <div className="space-y-3">
              {shuffledQuestions[currentQuestion]?.options.map((option: QuizAnswer, index: number) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleAnswerClick(option)}
                  disabled={quizLoading}
                  className="w-full text-left justify-start p-6 h-auto border-gray-300 hover:border-[#B95D38] hover:bg-[#B95D38]/10 transition-all duration-300 rounded-lg text-wrap"
                >
                  <span className="text-gray-700">{option.text}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}