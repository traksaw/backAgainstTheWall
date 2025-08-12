// lib/quiz/utils.ts
import { QuizQuestion, QuizAnswer, Archetype } from '@/types/quiz';
import { Shield, TrendingUp, Target, Eye, Award } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

/**
 * Creates randomized quiz questions with anti-pattern detection
 */
export function createAdvancedRandomizedQuestions(
  questions: QuizQuestion[],
  userClickPattern: number[] = []
): QuizQuestion[] {
  // Detect if user has a pattern (clicking same position repeatedly)
  const isRepetitive = userClickPattern.length >= 3 &&
    userClickPattern.slice(-3).every(pos => pos === userClickPattern[userClickPattern.length - 1]);

  return [...questions].map((question) => {
    let shuffledOptions = [...question.options];

    if (isRepetitive) {
      // If user is being repetitive, shuffle more aggressively
      shuffledOptions = shuffledOptions.sort(() => Math.random() - 0.5);

      // Sometimes swap the first two options to break the pattern
      if (Math.random() > 0.6) {
        [shuffledOptions[0], shuffledOptions[1]] = [shuffledOptions[1], shuffledOptions[0]];
      }
    } else {
      // Normal randomization
      shuffledOptions = shuffledOptions.sort(() => Math.random() - 0.5);
    }

    // Add slight point variations to prevent identical scores (10% chance)
    if (Math.random() > 0.9) {
      shuffledOptions = shuffledOptions.map(option => ({
        ...option,
        points: Math.max(1, option.points + (Math.random() > 0.5 ? 1 : -1))
      }));
    }

    return {
      ...question,
      options: shuffledOptions
    };
  }).sort(() => Math.random() - 0.5); // Always shuffle question order
}

/**
 * Calculates quiz scores for each archetype
 */
export function calculateQuizScores(answers: Record<number, QuizAnswer>): Record<Archetype, number> {
  const scores: Record<Archetype, number> = {
    Avoider: 0,
    Gambler: 0,
    Realist: 0,
    Architect: 0
  };

  // Count points for each archetype
  Object.values(answers).forEach(answer => {
    if (answer.archetype && answer.points) {
      scores[answer.archetype] += answer.points;
    }
  });

  return scores;
}

/**
 * Determines the winning archetype from scores
 */
export function getWinningArchetype(scores: Record<Archetype, number>): Archetype {
  const winningEntry = Object.entries(scores).reduce((a, b) =>
    a[1] > b[1] ? a : b
  );
  return winningEntry[0] as Archetype;
}

/**
 * Gets the appropriate icon for an archetype
 */
export function getArchetypeIcon(archetype: string): LucideIcon {
  switch (archetype) {
    case "Avoider":
      return Shield;
    case "Gambler":
      return TrendingUp;
    case "Realist":
      return Target;
    case "Architect":
      return Eye;
    default:
      return Award;
  }
}

/**
 * Detects repetitive clicking patterns and suggests anti-pattern questions
 */
export function detectRepetitivePattern(
  clickPattern: number[],
  archetypeDistribution: Record<Archetype, number>
): boolean {
  if (clickPattern.length < 4) return false;

  const lastFour = clickPattern.slice(-4);
  return lastFour.filter(pos => pos === lastFour[0]).length >= 3;
}

/**
 * Generates session ID for quiz submission
 */
export function generateSessionId(): string {
  return Math.random().toString(36).substr(2, 9);
}