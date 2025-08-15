// components/results/ResultsModal.tsx - Enhanced debugging version

"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QuizResult } from "@/types/quiz"

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
  
  // Enhanced debugging
  console.log('🎯 ResultsModal render:', {
    open,
    hasLatestResult: !!latestResult,
    latestResult,
    loading,
    latestResultId: latestResult?.id,
    archetype: latestResult?.archetype
  });

  // Show loading state
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl bg-white text-gray-900">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B95D38]"></div>
            <p className="ml-4 text-gray-600">Processing your results...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show results or debug info
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center">
            Your Financial Archetype
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {latestResult ? (
            <>
              {/* Main Result Display */}
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold text-[#B95D38]">
                  The {latestResult.archetype}
                </div>
                <div className="text-xl text-gray-700">
                  Your Score: {latestResult.score} points
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4 text-center">Score Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(latestResult.scores).map(([archetype, score]) => (
                    <div key={archetype} className="flex justify-between items-center">
                      <span className={archetype === latestResult.archetype ? 'font-bold text-[#B95D38]' : ''}>
                        {archetype}:
                      </span>
                      <span className={archetype === latestResult.archetype ? 'font-bold text-[#B95D38]' : ''}>
                        {score} points
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Archetype Description */}
              <div className="text-center space-y-4">
                {getArchetypeDescription(latestResult.archetype)}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={onResultsViewed}
                  className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white px-8 py-3"
                >
                  Watch Film as The {latestResult.archetype}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="px-8 py-3"
                >
                  Close Results
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Debug/Fallback Display */}
              <div className="text-center space-y-4">
                <div className="text-xl text-gray-700">
                  🔍 Debug: No results available
                </div>
                <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded">
                  <p>Debug info:</p>
                  <p>• open: {String(open)}</p>
                  <p>• loading: {String(loading)}</p>
                  <p>• latestResult: {latestResult ? 'exists' : 'null'}</p>
                </div>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="px-8 py-3"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function for archetype descriptions
function getArchetypeDescription(archetype: string) {
  const descriptions = {
    Avoider: (
      <div>
        <p className="text-lg mb-2">You prioritize financial security above all else.</p>
        <p className="text-gray-600">You prefer safe, guaranteed returns and avoid risky investments. Your careful approach protects your wealth but may limit growth opportunities.</p>
      </div>
    ),
    Gambler: (
      <div>
        <p className="text-lg mb-2">You thrive on high-risk, high-reward opportunities.</p>
        <p className="text-gray-600">You're willing to take big risks for potentially big gains. Your bold approach can lead to significant wealth but also substantial losses.</p>
      </div>
    ),
    Realist: (
      <div>
        <p className="text-lg mb-2">You balance risk and reward with practical wisdom.</p>
        <p className="text-gray-600">You make balanced financial decisions, taking calculated risks while maintaining stability. Your pragmatic approach builds steady wealth over time.</p>
      </div>
    ),
    Architect: (
      <div>
        <p className="text-lg mb-2">You build wealth through careful planning and analysis.</p>
        <p className="text-gray-600">You research thoroughly, optimize strategies, and plan for the long term. Your methodical approach maximizes returns through intelligent design.</p>
      </div>
    )
  };

  return descriptions[archetype as keyof typeof descriptions] || (
    <p className="text-gray-600">Your unique financial personality has been identified!</p>
  );
}