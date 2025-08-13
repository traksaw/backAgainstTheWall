// types/quiz.ts - Complete type definitions
export type Archetype = "Avoider" | "Gambler" | "Realist" | "Architect";

export interface QuizAnswer {
  text: string;
  archetype: Archetype;
  points: number;
  confidence?: number; // Optional confidence score 0-100
  selectedAt?: string; // ISO timestamp when answer was selected
}

export interface QuizMetrics {
  totalAnswers: number;
  answerBreakdown: Record<string, number>;
  diversityScore: number;
  averageConfidence: number;
}

export interface QuizSubmissionData {
  sessionId: string;
  answers: Record<number, QuizAnswer>;
  scores: Record<Archetype, number>;
  winningArchetype: Archetype;
  totalScore: number;
  metrics: QuizMetrics;
  completedAt: string;
  timeToComplete: number;
}

export interface QuizQuestion {
  id: number;
  text: string;
  options: QuizAnswer[];
  category?: string;
  required?: boolean;
}

export interface QuizState {
  answers: Record<number, QuizAnswer>;
  currentQuestion: number;
  isComplete: boolean;
  submissionData: QuizSubmissionData | null;
  startedAt?: string;
}