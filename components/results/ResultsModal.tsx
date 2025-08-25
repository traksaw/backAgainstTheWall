// components/results/ResultsModal.tsx - Finch-inspired gamified results

"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QuizResult, Archetype } from "@/types/quiz"
import { useState, useRef, useEffect } from "react"
import { FadeIn, FadeInUp, FadeInScale } from "@/components/ui/fade-in"
import { archetypeResults } from "@/lib/quiz/archetypes"
import type { ArchetypeResult } from "@/types/quiz"

interface ResultsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  latestResult: QuizResult | null
  onResultsViewed: () => void
  loading?: boolean
  onRetakeQuiz?: () => void
}

export function ResultsModal({ 
  open, 
  onOpenChange, 
  latestResult, 
  onResultsViewed, 
  loading = false,
  onRetakeQuiz,
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
        <DialogContent className="w-[95vw] max-w-md bg-white text-gray-900 border-0 p-0 rounded-2xl shadow-2xl">
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-center py-12 px-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B95D38]"></div>
              <p className="ml-4 text-gray-600">Processing your results...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const [activeTab, setActiveTab] = useState<'personality' | 'recommendations'>('personality');
  // Dynamic archetypes fetched from API; fallback to static if unavailable
  const [archetypesMap, setArchetypesMap] = useState<Record<string, ArchetypeResult>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/quiz/content', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled && data?.archetypes) {
          setArchetypesMap(data.archetypes as Record<string, ArchetypeResult>);
        }
      } catch (e) {
        // Fallback uses static import; no state change needed
        console.warn('⚠️ ResultsModal: using static archetypes due to fetch error', e);
      }
    })();
    return () => { cancelled = true };
  }, []);

  // Scroll container for reliable desktop/mobile scrolling
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Ensure we start at the top when opening
  useEffect(() => {
    if (open) {
      const el = scrollRef.current;
      if (el) {
        el.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    }
  }, [open]);

  // Show results with new Finch-inspired design
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg bg-gradient-to-br from-amber-50 to-orange-50 text-gray-900 border-0 p-0 rounded-2xl shadow-2xl">
        <div
          ref={scrollRef}
          className="max-h-[85vh] overflow-y-auto app-pad-lg p-4"
          tabIndex={0}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
        {latestResult ? (
          <div className="space-y-5 py-3">
            {/* Header with Character */}
            <FadeIn duration={800}>
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                  {(() => {
                    const colorMap: Record<Archetype, string> = {
                      Avoider: 'bg-blue-500',
                      Gambler: 'bg-red-500',
                      Realist: 'bg-green-500',
                      Architect: 'bg-yellow-400',
                    }
                    return (
                      <div className={`w-12 h-12 rounded-full ${colorMap[latestResult.archetype]}`} />
                    )
                  })()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    The {latestResult.archetype}
                  </h2>
                  <p className="text-sm text-gray-600 px-2">{(archetypesMap[latestResult.archetype] || archetypeResults[latestResult.archetype]).summary}</p>
                </div>
              </div>
            </FadeIn>

            {/* Tab Navigation */}
            <FadeInUp delay={200}>
              <div className="flex bg-white rounded-2xl p-1 shadow-sm">
                <button
                  onClick={() => setActiveTab('personality')}
                  className={`flex-1 py-2 px-3 rounded-xl font-medium text-xs transition-all ${
                    activeTab === 'personality'
                      ? 'bg-[#B95D38] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  PERSONALITY
                </button>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className={`flex-1 py-2 px-3 rounded-xl font-medium text-xs transition-all ${
                    activeTab === 'recommendations'
                      ? 'bg-[#B95D38] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  RECOMMENDATIONS
                </button>
              </div>
            </FadeInUp>

            {/* Personality Tab Content */}
            {activeTab === 'personality' ? (
              <FadeIn duration={600}>
                <div className="grid grid-cols-1 gap-4">
                  {/* Chart Section */}
                  <div className="flex flex-col items-center space-y-3">
                    <h3 className="text-base font-semibold text-gray-800 text-center">Your Financial Personality Profile</h3>
                    <HexagonalChart 
                      scores={(latestResult.answers as any)?.scores || {}} 
                      primaryArchetype={latestResult.archetype} 
                    />
                    <p className="text-xs text-gray-600 text-center max-w-md">
                      This chart shows your scores across all four financial personality types based on your quiz responses. Your highest score is <span className="font-semibold text-[#B95D38]">{latestResult.archetype}</span> with {(latestResult.answers as any)?.scores?.[latestResult.archetype] || latestResult.score} points.
                    </p>
                  </div>

                  {/* Archetype Description */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-base font-semibold text-gray-800 mb-3">Your Profile</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{(archetypesMap[latestResult.archetype] || archetypeResults[latestResult.archetype]).exploration.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2 text-sm">Strengths</h4>
                          <ul className="space-y-1 text-xs text-gray-600">
                            {(archetypesMap[latestResult.archetype] || archetypeResults[latestResult.archetype]).strengths.map((strength, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-green-500 mr-2">▪</span>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-orange-700 mb-2 text-sm">Blind Spots</h4>
                          <ul className="space-y-1 text-xs text-gray-600">
                            {(archetypesMap[latestResult.archetype] || archetypeResults[latestResult.archetype]).blindSpots.map((blindSpot, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-orange-500 mr-2">▪</span>
                                {blindSpot}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-3">
                        <h4 className="font-semibold text-gray-800 mb-2 text-sm">Reflection Question</h4>
                        <p className="text-xs text-gray-600 italic">{(archetypesMap[latestResult.archetype] || archetypeResults[latestResult.archetype]).reflectionQuestion}</p>
                      </div>
                      
                      <div className="bg-[#B95D38]/5 rounded-xl p-3">
                        <h4 className="font-semibold text-[#B95D38] mb-2 text-sm">Film Connection</h4>
                        <p className="text-xs text-gray-700">{(archetypesMap[latestResult.archetype] || archetypeResults[latestResult.archetype]).filmCharacterTieIn}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ) : (
              <FadeInScale delay={300}>
                <RecommendationsGrid
                  archetype={latestResult.archetype}
                  archetypesMap={Object.keys(archetypesMap).length ? archetypesMap : archetypeResults}
                />
              </FadeInScale>
            )}

            {/* Action Buttons */}
            <FadeInUp delay={400}>
              <div className="flex flex-col gap-3 justify-center pt-4">
                <Button
                  onClick={onResultsViewed}
                  className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all text-sm"
                >
                  Watch Film as The {latestResult.archetype}
                </Button>
                {onRetakeQuiz && (
                  <Button
                    variant="outline"
                    onClick={onRetakeQuiz}
                    className="px-6 py-3 rounded-2xl font-semibold border-2 hover:bg-gray-50 text-sm"
                  >
                    Retake Quiz
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="px-6 py-3 rounded-2xl font-semibold border-2 hover:bg-gray-50 text-sm"
                >
                  Close Results
                </Button>
              </div>
            </FadeInUp>
          </div>
        ) : (
          <div className="text-center space-y-4 py-12">
            <div className="text-xl text-gray-700">
              No results available
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="px-8 py-3 rounded-2xl"
            >
              Close
            </Button>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Minimal Chart Component - Clean & Accessible & Mobile-Responsive
function HexagonalChart({ scores, primaryArchetype }: { scores: Record<string, number>, primaryArchetype: string }) {
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const archetypes: Archetype[] = ['Avoider', 'Gambler', 'Realist', 'Architect'];
  const maxScore = Math.max(...Object.values(scores));
  
  // Force mobile sizing across all devices
  const isMobile = true;
  const size = isMobile ? 200 : 240;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = isMobile ? 60 : 80;
  
  const getPoint = (index: number, value: number) => {
    const angle = (index * Math.PI * 2) / archetypes.length - Math.PI / 2;
    const normalizedValue = (value / maxScore) * radius;
    return {
      x: centerX + Math.cos(angle) * normalizedValue,
      y: centerY + Math.sin(angle) * normalizedValue
    };
  };
  
  const getLabelPoint = (index: number) => {
    const angle = (index * Math.PI * 2) / archetypes.length - Math.PI / 2;
    const labelRadius = radius * (isMobile ? 0.5 : 0.6); // Closer to center on mobile
    return {
      x: centerX + Math.cos(angle) * labelRadius,
      y: centerY + Math.sin(angle) * labelRadius
    };
  };
  
  const dataPoints = archetypes.map((archetype, index) => 
    getPoint(index, scores[archetype] || 0)
  );
  
  // Create circular grid lines for reference
  const gridCircles = [0.25, 0.5, 0.75, 1.0].map(ratio => ratio * radius);
  
  const pathData = dataPoints.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';
  
  return (
    <div className="relative">
      <svg width={size} height={size} className="overflow-visible">
        
        {/* Circular grid lines */}
        {gridCircles.map((circleRadius, index) => (
          <circle
            key={index}
            cx={centerX}
            cy={centerY}
            r={circleRadius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="1"
            opacity={0.3}
          />
        ))}
        
        {/* Radial grid lines */}
        {archetypes.map((_, index) => {
          const angle = (index * Math.PI * 2) / archetypes.length - Math.PI / 2;
          const endX = centerX + Math.cos(angle) * radius;
          const endY = centerY + Math.sin(angle) * radius;
          return (
            <line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke="#f3f4f6"
              strokeWidth="1"
              opacity={0.3}
            />
          );
        })}
        
        {/* Data visualization area */}
        <path
          d={pathData}
          fill="rgba(185, 93, 56, 0.15)"
          stroke="#B95D38"
          strokeWidth="2"
        />
        
        {/* Data points */}
        {dataPoints.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#B95D38"
            stroke="white"
            strokeWidth="2"
          />
        ))}
        
        {/* Interior labels */}
        {archetypes.map((archetype, index) => {
          const labelPoint = getLabelPoint(index);
          const isPrimary = archetype === primaryArchetype;
          const isSelected = selectedPoint === archetype;
          return (
            <g key={archetype}>
              <text
                x={labelPoint.x}
                y={labelPoint.y - (isMobile ? 6 : 8)}
                textAnchor="middle"
                className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-semibold cursor-pointer transition-colors duration-200 ${
                  isPrimary ? 'fill-[#B95D38]' : isSelected ? 'fill-[#D97706]' : 'fill-gray-600 hover:fill-gray-800'
                }`}
                onClick={() => setSelectedPoint(selectedPoint === archetype ? null : archetype)}
              >
                {archetype}
              </text>
              <text
                x={labelPoint.x}
                y={labelPoint.y + (isMobile ? 6 : 8)}
                textAnchor="middle"
                className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold cursor-pointer transition-colors duration-200 ${
                  isPrimary ? 'fill-[#B95D38]' : isSelected ? 'fill-[#D97706]' : 'fill-gray-700 hover:fill-gray-900'
                }`}
                onClick={() => setSelectedPoint(selectedPoint === archetype ? null : archetype)}
              >
                {scores[archetype]}
              </text>
            </g>
          );
        })}
      </svg>
      
    </div>
  );
}

// Recommendations Grid Component - Finch-style cards
function RecommendationsGrid({ archetype, archetypesMap }: { archetype: string, archetypesMap: Record<string, ArchetypeResult> }) {
  const recommendations = getRecommendations(archetype, archetypesMap);
  
  return (
    <div className="space-y-6">
      {recommendations.map((category: any, categoryIndex: number) => (
        <div key={category.title} className="bg-white rounded-2xl p-6 shadow-sm">
          {/* Category Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-[#B95D38] text-white rounded-lg flex items-center justify-center text-sm font-bold">
              {category.title[0]}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{category.title}</h3>
              <p className="text-sm text-gray-600">{category.subtitle}</p>
            </div>
            <div className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              {category.items.length} / {category.items.length}
            </div>
          </div>
          
          {/* Cards Grid - always single column */}
          <div className="grid grid-cols-1 gap-3">
            {category.items.map((item: any, itemIndex: number) => (
              <div
                key={itemIndex}
                className="group bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-3 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
              >
                <h4 className="font-medium text-gray-800 text-xs mb-2 leading-tight">
                  {item.title}
                </h4>
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  {item.description.length > 60 ? item.description.substring(0, 60) + '...' : item.description}
                </p>
                {/* Progress indicator like Finch */}
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-[10px] text-gray-500">
                    {Math.floor(Math.random() * 50) + 10} / {Math.floor(Math.random() * 30) + 50}
                  </div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function getRecommendations(archetype: string, archetypesMap: Record<string, ArchetypeResult>) {
  const archetypeData = (archetypesMap[archetype] || archetypeResults[archetype as keyof typeof archetypeResults]) as ArchetypeResult | undefined;
  if (!archetypeData) return [];
  
  return [
    {
      title: "Tips",
      subtitle: "Personalized strategies",
      items: archetypeData.exploration.tips.map((tip: string, index: number) => ({
        icon: (index + 1).toString(),
        title: tip.split('.')[0] || tip.substring(0, 35),
        description: tip
      }))
    },
    {
      title: "Resources", 
      subtitle: "Tools and materials",
      items: archetypeData.exploration.resources.map((resource: string, index: number) => {
        const [type, content] = resource.split(': ');
        return {
          icon: type ? type[0].toUpperCase() : (index + 1).toString(),
          title: type || `Resource ${index + 1}`,
          description: content || resource
        };
      })
    },
    {
      title: "Next Steps",
      subtitle: "Action items", 
      items: archetypeData.exploration.nextSteps.map((step: string, index: number) => ({
        icon: (index + 1).toString(),
        title: step.split('.')[0] || step.substring(0, 30),
        description: step
      }))
    }
  ];
}