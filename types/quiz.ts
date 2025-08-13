// types/quiz.ts

// ---- Core enums / aliases
export type Archetype = 'Avoider' | 'Gambler' | 'Realist' | 'Architect'

// ---- Question / answer / state
export interface QuizQuestion {
  id: number
  text: string
  options: Array<{
    text: string
    archetype: Archetype
    points: number
  }>
}

export interface QuizAnswer {
  // key is usually the question index; this shape is for each stored answer
  questionId?: number
  text: string
  archetype: Archetype
  points: number
}

export interface QuizState {
  currentQuestionIndex: number
  answers: Record<number, QuizAnswer>
  totalQuestions: number
  isSubmitting?: boolean
}

// ---- Scores & results
export type QuizScores = Record<Archetype, number>

export interface ArchetypeExploration {
  archetype: Archetype
  description: string
  tips?: string[]
}

export interface ArchetypeResult {
  archetype: Archetype
  score: number
  breakdown: QuizScores
}

/**
 * Result shown to the user after submission
 * (Extend if you already store more fields elsewhere)
 */
export interface QuizResult {
  id?: string
  archetype: Archetype
  score: number
  scores: QuizScores
  createdAt?: string   // use string, not Date, for UI components
}


// ---- Submission payload your logic returns (and handlers consume)
export interface QuizSubmissionData {
  answers: Record<number, QuizAnswer>
  sessionId: string
  archetype: Archetype
  score: number
  scores: QuizScores
}
