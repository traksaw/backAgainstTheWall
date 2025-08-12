// types/quiz.ts
export interface QuizAnswer {
  id: number;
  text: string;
  archetype: "Avoider" | "Gambler" | "Realist" | "Architect";
  points: number;
  question?: string; // Added during quiz for history
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: QuizAnswer[];
}

export type Archetype = "Avoider" | "Gambler" | "Realist" | "Architect";

// Updated to match your actual data structure
export interface QuizResult {
  _id: string; // MongoDB ID - make this required since your data has it
  id?: string; // Optional alternative ID
  user_id: string;
  archetype: Archetype;
  score: number;
  answers: {
    responses: Record<number, QuizAnswer>;
    scores: Record<string, number>;
    totalQuestions: number;
    completedAt: string;
  };
  completed_at?: string;
  session_id?: string;
  has_viewed_results?: boolean;
  has_watched_film?: boolean;
  hasViewedResults?: boolean; // Alternative naming
  hasWatchedFilm?: boolean;   // Alternative naming
  created_at?: string;
  updated_at?: string;
}

export interface ArchetypeExploration {
  description: string;
  tips: string[];
  resources: string[];
  nextSteps: string[];
}

export interface ArchetypeResult {
  archetype: Archetype;
  summary: string;
  strengths: string[];
  blindSpots: string[];
  reflectionQuestion: string;
  filmCharacterTieIn: string;
  exploration: ArchetypeExploration;
}

export interface QuizState {
  currentQuestion: number;
  answers: Record<number, QuizAnswer>;
  shuffledQuestions: QuizQuestion[];
  showWelcome: boolean;
  clickPattern: number[];
  archetypeDistribution: Record<Archetype, number>;
}

export interface QuizSubmissionData {
  answers: Record<number, QuizAnswer>;
  sessionId: string;
  archetype: Archetype;
  score: number;
}