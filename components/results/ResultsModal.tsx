// components/results/ResultsModal.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, BookOpen } from "lucide-react"
import { QuizAnswersDisplay } from "@/components/QuizAnswersDisplay"
import { archetypeResults } from "@/lib/quiz/archetypes"
import { getArchetypeIcon } from "@/lib/quiz/utils"
import type { QuizResult, Archetype } from "@/types/quiz"

interface ResultsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  latestResult: QuizResult | null
  onResultsViewed: () => void
  loading?: boolean
}

export function ResultsModal({ 
  open, 
  onOpenChange, 
  latestResult, 
  onResultsViewed, 
  loading = false 
}: ResultsModalProps) {
  if (!latestResult || !latestResult._id) {
    return null
  }

  const currentArchetype = archetypeResults[latestResult.archetype as Archetype]
  const IconComponent = getArchetypeIcon(currentArchetype.archetype)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-white text-gray-900 border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center text-gray-900">
            Your Financial Archetype
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Archetype Header */}
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-[#B95D38]/10 rounded-full flex items-center justify-center mx-auto">
              <IconComponent className="w-12 h-12 text-[#B95D38]" />
            </div>
            <div>
              <h3 className="text-4xl font-bold text-[#B95D38] mb-3">
                The {currentArchetype.archetype}
              </h3>
              <p className="text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
                {currentArchetype.summary}
              </p>
            </div>
          </div>

          {/* Quiz Answers Display */}
          {latestResult._id && (
            <QuizAnswersDisplay
              latestResult={{
                ...latestResult,
                hasViewedResults: latestResult.hasViewedResults ?? false,
                hasWatchedFilm: latestResult.hasWatchedFilm ?? false,
              }}
            />
          )}

          {/* Strengths and Blind Spots */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700 text-lg">Your Strengths</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentArchetype.strengths.map((strength, index) => (
                  <div key={index} className="text-gray-700 flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {strength}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-700 text-lg">Potential Blind Spots</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentArchetype.blindSpots.map((blindSpot, index) => (
                  <div key={index} className="text-gray-700 flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    {blindSpot}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Reflection Question */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-700 text-lg">Reflection Question</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-lg leading-relaxed">
                {currentArchetype.reflectionQuestion}
              </p>
            </CardContent>
          </Card>

          {/* Film Connection */}
          <Card className="border-[#B95D38]/20 bg-[#B95D38]/10">
            <CardHeader>
              <CardTitle className="text-[#B95D38] text-lg">Your Film Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-lg leading-relaxed">
                {currentArchetype.filmCharacterTieIn}
              </p>
            </CardContent>
          </Card>

          {/* Exploration Section */}
          <Card className="border-[#669CCB]/20 bg-[#669CCB]/10">
            <CardHeader>
              <CardTitle className="text-[#669CCB] text-xl flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Explore Your {currentArchetype.archetype} Mindset
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700 leading-relaxed">
                {currentArchetype.exploration.description}
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-[#669CCB] mb-3">Actionable Tips</h4>
                  <ul className="space-y-2">
                    {currentArchetype.exploration.tips.map((tip, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-[#669CCB] mr-2">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#669CCB] mb-3">Recommended Resources</h4>
                  <ul className="space-y-2">
                    {currentArchetype.exploration.resources.map((resource, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-[#669CCB] mr-2">•</span>
                        {resource}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-[#669CCB] mb-3">Next Steps</h4>
                <ul className="space-y-2">
                  {currentArchetype.exploration.nextSteps.map((step, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="text-[#669CCB] mr-2">•</span>
                      {step}
                    </li>
                  ))}
                </ul>
                </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="flex justify-center">
            <Button
              onClick={onResultsViewed}
              disabled={loading}
              className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold py-4 px-12 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Now Watch the Film
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}