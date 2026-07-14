// types/quiz.ts - COMPLETE FIXED VERSION

// ---- Core enums / aliases
export type Archetype = 'Avoider' | 'Gambler' | 'Realist' | 'Architect'

export interface QuizOption {
  id?: number          // allow ids for UI keys
  text: string
  question?: string    // optional for backward compatibility
  archetype: Archetype
  points: number
}

// ---- Question / answer / state
export interface QuizQuestion {
  id: number
  text: string         // ✅ Main question text
  question?: string    // ✅ Alternative property name for compatibility
  options: QuizOption[]
}

export interface QuizAnswer {
  // key is usually the question index; this shape is for each stored answer
  id?: number          // allow ids for UI keys
  questionId?: number
  text: string
  question?: string    // ✅ Added for compatibility
  archetype: Archetype
  points: number
}

export interface QuizState {
  currentQuestion: number      // ✅ Match what useQuizState exports
  answers: Record<number, QuizAnswer>
  shuffledQuestions: QuizQuestion[]  // ✅ Match what useQuizState exports
  showWelcome: boolean         // ✅ Match what useQuizState exports
  clickPattern: number[]       // ✅ Match what useQuizState exports
  archetypeDistribution: Record<Archetype, number>  // ✅ Match what useQuizState exports
  totalQuestions?: number
  isSubmitting?: boolean
}

// ---- Scores & results
export type QuizScores = Record<Archetype, number>

export interface ArchetypeExploration {
  description: string
  tips: string[]
  resources: string[]
  nextSteps: string[]
}

export interface ArchetypeResult {
  archetype: Archetype
  summary: string
  strengths: string[]
  blindSpots: string[]
  reflectionQuestion: string
  filmCharacterTieIn: string
  exploration: ArchetypeExploration
}

/**
 * FIXED: Complete QuizResult interface with ALL required properties
 */
export interface QuizResult {
  _id?: string                          // Your ResultsModal expects _id
  id?: string                          // Backup id field
  userId?: string                      // added: was lib/quiz.ts-only
  archetype: Archetype                 // Required
  score: number                        // Required
  scores: QuizScores                   // Required
  createdAt?: string                   // ISO string format
  updatedAt?: string                   // added: was lib/quiz.ts-only
  hasViewedResults?: boolean           // For your UI state tracking
  hasWatchedFilm?: boolean            // For your UI state tracking
  answers?: Record<number, QuizAnswer> // Rendered by QuizHistorySection
  sessionId?: string                   // Session tracking
}

// ---- Submission payload your logic returns (and handlers consume)
export interface QuizSubmissionData {
  answers: Record<number, QuizAnswer>
  sessionId: string
  archetype: Archetype
  score: number
  scores: QuizScores
}