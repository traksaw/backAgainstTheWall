// hooks/useQuizHandlers.ts
import { useQuiz } from "@/hooks/useQuiz"
import { useQuizLogic } from "@/hooks/useQuizLogic"
import type { QuizAnswer, QuizSubmissionData } from "@/types/quiz"

export function useQuizHandlers() {
  const { submitQuiz, updateQuizResult, loading: quizLoading } = useQuiz()
  const quizLogic = useQuizLogic()

  /**
   * Handle quiz completion and submission
   */
  const handleQuizComplete = async (answers: Record<number, QuizAnswer>) => {
    try {
      // Process the quiz completion to get submission data
      const quizData: QuizSubmissionData = quizLogic.processQuizCompletion(answers)
      
      // Submit to backend
      await submitQuiz(answers)
      
      return quizData
    } catch (error) {
      console.error('=== QUIZ SUBMISSION ERROR ===')
      console.error('Full error object:', error)
      console.error('================================')
      
      throw new Error(`Quiz submission failed: ${(error as any)?.message || 'Unknown error'}`)
    }
  }

  /**
   * Handle results viewed update
   */
  const handleResultsViewed = async (latestResult: any) => {
    if (latestResult && !latestResult.hasViewedResults && !latestResult.has_viewed_results) {
      try {
        const resultId = latestResult._id || latestResult.id
        if (!resultId) {
          console.error("No valid ID found in latestResult:", latestResult)
          return
        }
        await updateQuizResult(resultId, { hasViewedResults: true })
      } catch (error) {
        console.error("Error updating results viewed:", error)
      }
    }
  }

  /**
   * Handle film completion update
   */
  const handleFilmComplete = async (latestResult: any) => {
    if (latestResult && !latestResult.hasWatchedFilm && !latestResult.has_watched_film) {
      try {
        const resultId = latestResult._id || latestResult.id
        if (!resultId) {
          console.error("No valid ID found in latestResult:", latestResult)
          return
        }
        await updateQuizResult(resultId, { hasWatchedFilm: true })
      } catch (error) {
        console.error("Error updating film watched:", error)
      }
    }
  }

  /**
   * Handle video errors
   */
  const handleVideoError = (error: string) => {
    console.error("Video playback error:", error)
    // Could show a toast notification or other user feedback here
  }

  /**
   * Start new quiz with fresh state
   */
  const handleStartNewQuiz = () => {
    // This would be used with quiz state reset
    return {
      showQuiz: true,
      showWelcome: true,
      resetState: true
    }
  }

  return {
    // Main handlers
    handleQuizComplete,
    handleResultsViewed,
    handleFilmComplete,
    handleVideoError,
    handleStartNewQuiz,
    
    // Loading state
    quizLoading,
    
    // Quiz logic utilities (expose for use in components)
    validateQuizAnswers: quizLogic.validateQuizAnswers,
    getCompletionPercentage: quizLogic.getCompletionPercentage,
    isReadyForSubmission: quizLogic.isReadyForSubmission,
  }
}