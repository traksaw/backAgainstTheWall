// lib/quiz/types.ts
// Re-export types for convenient access within the quiz lib
export type {
  QuizAnswer,
  QuizQuestion,
  Archetype,
  QuizResult,
  ArchetypeExploration,
  ArchetypeResult,
  QuizState,
  QuizSubmissionData
} from '@/types/quiz'

// Additional quiz-specific types that are only used within the quiz logic
export interface QuizConfiguration {
  totalQuestions: number
  pointsPerQuestion: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  antiPatternDetection: boolean
}

export interface QuizScores {
  Avoider: number
  Gambler: number
  Realist: number
  Architect: number
}

export interface QuizAnalytics {
  completionTime: number
  clickPattern: number[]
  archetypeDistribution: Record<string, number>
  repeatQuestionIndices: number[]
  averageResponseTime: number
}

export interface QuizValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface PatternDetectionResult {
  isRepetitive: boolean
  patternType: 'sequential' | 'alternating' | 'same-position' | 'random'
  confidence: number
  suggestedAction: 'shuffle' | 'reorder' | 'warn' | 'none'
}

export interface QuizSessionData {
  sessionId: string
  startTime: Date
  endTime?: Date
  userAgent: string
  screenResolution: string
  timezone: string
}