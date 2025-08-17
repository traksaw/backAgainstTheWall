"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/useAuth"
import { useQuiz } from "@/hooks/useQuiz"
import {
  Calendar,
  Award,
  Eye,
  ChevronRight,
  Clock,
  BarChart3,
  Shield,
  TrendingUp,
  Target,
  CheckCircle,
  X,
} from "lucide-react"
import type { IQuizResult } from "@/models/QuizResult"

interface QuizHistorySectionProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuizHistorySection({ open, onOpenChange }: QuizHistorySectionProps) {
  const { user } = useAuth()
  const { quizResults, loading } = useQuiz()
  const [selectedResult, setSelectedResult] = useState<IQuizResult | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const viewResultDetails = (result: IQuizResult) => {
    setSelectedResult(result)
    setShowDetailModal(true)
  }

  const getArchetypeIcon = (archetype: string) => {
    switch (archetype) {
      case "Avoider":
        return Shield
      case "Gambler":
        return TrendingUp
      case "Realist":
        return Target
      case "Architect":
        return Eye
      default:
        return Award
    }
  }

  const getArchetypeColor = (archetype: string) => {
    switch (archetype) {
      case "Avoider":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Gambler":
        return "bg-red-100 text-red-800 border-red-200"
      case "Realist":
        return "bg-green-100 text-green-800 border-green-200"
      case "Architect":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return "Unknown Date"
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Invalid Date"
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Invalid Date"
    }
  }

  // Helper function to get the number of questions answered
  const getQuestionsAnswered = (result: IQuizResult) => {
  
  if (result.answers?.totalQuestions) {
    return result.answers.totalQuestions
  }
  if (result.answers?.responses) {
    const count = Object.keys(result.answers.responses).length
    return count
  }
  return 0
  }

  // Helper function to get completion date
  const getCompletionDate = (result: IQuizResult) => {
    // Try different possible date fields
    return result.completedAt || 
           result.answers?.completedAt || 
           result.createdAt || 
           result.updatedAt ||
           undefined
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl bg-white">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">Loading your quiz history...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-screen max-w-none h-[100dvh] m-0 rounded-none bg-white text-gray-900 border-0 shadow-2xl overflow-y-auto p-0 sm:w-[92vw] sm:max-w-2xl md:max-w-5xl sm:h-auto sm:m-0 sm:rounded-2xl sm:p-6">
          <DialogHeader className="sticky top-0 z-10 bg-white border-b p-4 sm:p-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-[#B95D38]" />
                Your Quiz History
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                aria-label="Close"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-gray-600 mt-2 text-sm sm:text-base text-center sm:text-left">
              Review your financial personality assessments and track your journey
            </p>
          </DialogHeader>

          <div className="py-6">
            {quizResults.length === 0 ? (
              <div className="text-center py-10 sm:py-12">
                <Award className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No Quiz Results Yet</h3>
                <p className="text-sm sm:text-base text-gray-500">Take your first financial personality quiz to see your results here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quizResults.map((result, index) => {
                  const IconComponent = getArchetypeIcon(result.archetype)
                  const completionDate = getCompletionDate(result)
                  
                  return (
                    <Card
                      key={result._id}
                      className="border-gray-200 hover:border-[#B95D38]/30 transition-all duration-300 hover:shadow-md"
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex items-start md:items-center gap-3 sm:gap-4 min-w-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#B95D38]/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-[#B95D38]" />
                            </div>

                            <div className="space-y-2 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <Badge className={`${getArchetypeColor(result.archetype)} font-medium text-xs sm:text-sm`}>
                                  The {result.archetype}
                                </Badge>
                                {index === 0 && (
                                  <Badge variant="outline" className="border-green-500 text-green-600 text-xs sm:text-sm">
                                    Latest
                                  </Badge>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                                <div className="flex items-center min-w-0">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  <span className="truncate">{formatDate(completionDate)}</span>
                                </div>
                                <div className="flex items-center">
                                  <BarChart3 className="w-4 h-4 mr-1" />
                                  Score: {result.score || 0}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm text-gray-500">
                              {result.hasViewedResults && (
                                <div className="flex items-center">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                  <span>Results Viewed</span>
                                </div>
                              )}
                              {result.hasWatchedFilm && (
                                <div className="flex items-center">
                                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                  <span>Film Watched</span>
                                </div>
                              )}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewResultDetails(result)}
                              className="border-[#B95D38] text-[#B95D38] hover:bg-[#B95D38]/10 w-full sm:w-auto"
                            >
                              View Details
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detailed Result Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="w-screen max-w-none h-[100dvh] m-0 rounded-none bg-white text-gray-900 border-0 shadow-2xl overflow-y-auto p-0 sm:w-[92vw] sm:max-w-2xl md:max-w-4xl sm:h-auto sm:m-0 sm:rounded-2xl sm:p-6">
          <DialogHeader className="sticky top-0 z-10 bg-white border-b p-4 sm:p-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">Quiz Results Details</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                aria-label="Close"
                onClick={() => setShowDetailModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          {selectedResult && (
            <div className="py-6 space-y-8">
              {/* Result Summary */}
              <div className="text-center space-y-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#B95D38]/20 rounded-full flex items-center justify-center mx-auto">
                  {(() => {
                    const IconComponent = getArchetypeIcon(selectedResult.archetype)
                    return <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-[#B95D38]" />
                  })()}
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#B95D38] mb-2">The {selectedResult.archetype}</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Completed on {formatDate(getCompletionDate(selectedResult))}
                  </p>
                </div>
              </div>

              {/* Score Breakdown */}
              {selectedResult.answers?.scores && (
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg text-gray-800">Score Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      {Object.entries(selectedResult.answers.scores).map(([archetype, score]) => (
                        <div key={archetype} className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-xl sm:text-2xl font-bold text-gray-800">{score as number}</div>
                          <div className="text-xs sm:text-sm text-gray-600">{archetype}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Answers */}
              {selectedResult.answers?.responses && (
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg text-gray-800">Your Responses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5 sm:space-y-6">
                      {Object.entries(selectedResult.answers.responses).map(
                        ([questionIndex, answer]: [string, any]) => {
                          const questionNum = Number.parseInt(questionIndex) + 1
                          return (
                            <div key={questionIndex} className="border-b border-gray-100 pb-4 last:border-b-0">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium text-gray-800 flex-1 text-sm sm:text-base break-words">
                                    <span className="text-[#B95D38] mr-2">Q{questionNum}:</span>
                                    {answer.question || `Question ${questionNum}`}
                                  </h4>
                                </div>

                                <div className="ml-4 sm:ml-8">
                                  <div className="flex items-center space-x-3">
                                    <Badge className={`${getArchetypeColor(answer.archetype)} text-[10px] sm:text-xs`}>
                                      {answer.archetype}
                                    </Badge>
                                    <span className="text-sm sm:text-base text-gray-700">{answer.text}</span>
                                    <span className="text-xs sm:text-sm text-gray-500">({answer.points} pts)</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        },
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quiz Statistics - FIXED */}
              <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
                <Card className="border-gray-200 bg-blue-50">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-base sm:text-lg font-semibold text-blue-700">
                      {getQuestionsAnswered(selectedResult)}
                    </div>
                    <div className="text-xs sm:text-sm text-blue-600">Questions Answered</div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 bg-green-50">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Award className="w-7 h-7 sm:w-8 sm:h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-base sm:text-lg font-semibold text-green-700">{selectedResult.score || 0}</div>
                    <div className="text-xs sm:text-sm text-green-600">Final Score</div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 bg-purple-50">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Eye className="w-7 h-7 sm:w-8 sm:h-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-base sm:text-lg font-semibold text-purple-700">
                      {selectedResult.hasWatchedFilm ? "Yes" : "No"}
                    </div>
                    <div className="text-xs sm:text-sm text-purple-600">Film Watched</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}