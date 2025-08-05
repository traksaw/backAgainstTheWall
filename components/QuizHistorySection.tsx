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

  const debugQuizData = (result: IQuizResult) => {
  console.log('=== QUIZ RESULT DEBUG ===')
  console.log('Full result object:', result)
  console.log('result.answers:', result.answers)
  console.log('result.answers?.totalQuestions:', result.answers?.totalQuestions)
  console.log('result.answers?.responses:', result.answers?.responses)
  if (result.answers?.responses) {
    console.log('Number of responses:', Object.keys(result.answers.responses).length)
    console.log('Response keys:', Object.keys(result.answers.responses))
  }
  console.log('=========================')
}

  // Helper function to get the number of questions answered
  const getQuestionsAnswered = (result: IQuizResult) => {
    debugQuizData(result) // Add this line for debugging
  
  if (result.answers?.totalQuestions) {
    console.log('Using totalQuestions:', result.answers.totalQuestions)
    return result.answers.totalQuestions
  }
  if (result.answers?.responses) {
    const count = Object.keys(result.answers.responses).length
    console.log('Using responses count:', count)
    return count
  }
  console.log('Falling back to 0')
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
        <DialogContent className="max-w-5xl bg-white text-gray-900 border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center text-gray-900 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 mr-3 text-[#B95D38]" />
              Your Quiz History
            </DialogTitle>
            <p className="text-center text-gray-600 mt-2">
              Review your financial personality assessments and track your journey
            </p>
          </DialogHeader>

          <div className="py-6">
            {quizResults.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Quiz Results Yet</h3>
                <p className="text-gray-500">Take your first financial personality quiz to see your results here.</p>
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
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-[#B95D38]/20 rounded-full flex items-center justify-center">
                              <IconComponent className="w-6 h-6 text-[#B95D38]" />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center space-x-3">
                                <Badge className={`${getArchetypeColor(result.archetype)} font-medium`}>
                                  The {result.archetype}
                                </Badge>
                                {index === 0 && (
                                  <Badge variant="outline" className="border-green-500 text-green-600">
                                    Latest
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {formatDate(completionDate)}
                                </div>
                                <div className="flex items-center">
                                  <BarChart3 className="w-4 h-4 mr-1" />
                                  Score: {result.score || 0}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
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
                              className="border-[#B95D38] text-[#B95D38] hover:bg-[#B95D38]/10"
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
        <DialogContent className="max-w-4xl bg-white text-gray-900 border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-gray-900">Quiz Results Details</DialogTitle>
            </div>
          </DialogHeader>

          {selectedResult && (
            <div className="py-6 space-y-8">
              {/* Result Summary */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-[#B95D38]/20 rounded-full flex items-center justify-center mx-auto">
                  {(() => {
                    const IconComponent = getArchetypeIcon(selectedResult.archetype)
                    return <IconComponent className="w-8 h-8 text-[#B95D38]" />
                  })()}
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-[#B95D38] mb-2">The {selectedResult.archetype}</h3>
                  <p className="text-gray-600">
                    Completed on {formatDate(getCompletionDate(selectedResult))}
                  </p>
                </div>
              </div>

              {/* Score Breakdown */}
              {selectedResult.answers?.scores && (
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">Score Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(selectedResult.answers.scores).map(([archetype, score]) => (
                        <div key={archetype} className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-800">{score as number}</div>
                          <div className="text-sm text-gray-600">{archetype}</div>
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
                    <CardTitle className="text-lg text-gray-800">Your Responses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(selectedResult.answers.responses).map(
                        ([questionIndex, answer]: [string, any]) => {
                          const questionNum = Number.parseInt(questionIndex) + 1
                          return (
                            <div key={questionIndex} className="border-b border-gray-100 pb-4 last:border-b-0">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium text-gray-800 flex-1">
                                    <span className="text-[#B95D38] mr-2">Q{questionNum}:</span>
                                    {answer.question || `Question ${questionNum}`}
                                  </h4>
                                </div>

                                <div className="ml-8">
                                  <div className="flex items-center space-x-3">
                                    <Badge className={`${getArchetypeColor(answer.archetype)} text-xs`}>
                                      {answer.archetype}
                                    </Badge>
                                    <span className="text-gray-700">{answer.text}</span>
                                    <span className="text-sm text-gray-500">({answer.points} pts)</span>
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
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-gray-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-blue-700">
                      {getQuestionsAnswered(selectedResult)}
                    </div>
                    <div className="text-sm text-blue-600">Questions Answered</div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-green-700">{selectedResult.score || 0}</div>
                    <div className="text-sm text-green-600">Final Score</div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 bg-purple-50">
                  <CardContent className="p-4 text-center">
                    <Eye className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-purple-700">
                      {selectedResult.hasWatchedFilm ? "Yes" : "No"}
                    </div>
                    <div className="text-sm text-purple-600">Film Watched</div>
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