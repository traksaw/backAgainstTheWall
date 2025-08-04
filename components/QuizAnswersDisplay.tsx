"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, EyeOff, Eye, List } from "lucide-react"

interface QuizAnswer {
  id: number
  text: string
  archetype: "Avoider" | "Gambler" | "Realist" | "Architect"
  points: number
  question?: string
}

// interface QuizResponse {
//   question: string
//   text: string
//   archetype: string
//   points: number
// }

interface QuizResult {
  _id: string
  archetype: string
  score: number
  hasViewedResults: boolean
  hasWatchedFilm: boolean
  answers: {
    responses: Record<number, QuizAnswer>
    scores: Record<string, number>
    totalQuestions: number
    completedAt: string
  }
}

interface QuizAnswersDisplayProps {
  latestResult: QuizResult | null
}

function getArchetypeColor(archetype: string): string {
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

function QuizAnswersDisplay({ latestResult }: QuizAnswersDisplayProps) {
  const [showAnswers, setShowAnswers] = useState(false)

  if (!latestResult?.answers?.responses || Object.keys(latestResult.answers.responses).length === 0) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-6 text-center">
          <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Your quiz answers are not available at this time.</p>
        </CardContent>
      </Card>
    )
  }

  const answersArray = Object.entries(latestResult.answers.responses).map(
    ([questionIndex, answer]) => ({
      questionIndex: Number(questionIndex),
      ...answer,
    })
  ).sort((a, b) => a.questionIndex - b.questionIndex)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <List className="w-5 h-5 mr-2" />
          Your Quiz Responses
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAnswers(!showAnswers)}
          className="flex items-center gap-2"
        >
          {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showAnswers ? "Hide" : "Show"} Answers
        </Button>
      </div>

      {showAnswers && (
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="space-y-6">
              {answersArray.map((answer, index) => (
                <div key={answer.questionIndex} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-gray-800 flex-1">
                        <span className="text-[#B95D38] mr-2">Q{index + 1}:</span>
                        {answer.question || `Question ${index + 1}`}
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
              ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-semibold text-gray-800">{answersArray.length}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-semibold text-gray-800">
                    {answersArray.reduce((sum, answer) => sum + (answer.points || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Points</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-semibold text-gray-800">{latestResult.archetype}</div>
                  <div className="text-sm text-gray-600">Result</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-semibold text-gray-800">{latestResult.score}</div>
                  <div className="text-sm text-gray-600">Final Score</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export { QuizAnswersDisplay }
