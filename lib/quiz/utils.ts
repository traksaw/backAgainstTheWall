// lib/quiz/utils.ts - Updated version with enhanced scoring

import { QuizQuestion, QuizAnswer, Archetype, QuizScores } from '@/types/quiz';
import { Shield, TrendingUp, Target, Eye, Award } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export const ARCHETYPES: Archetype[] = ['Avoider', 'Gambler', 'Realist', 'Architect']
export const EMPTY_SCORES: QuizScores = ARCHETYPES.reduce((acc, a) => {
  acc[a] = 0
  return acc
}, {} as QuizScores)

/**
 * Creates randomized quiz questions with anti-pattern detection
 */
export function createAdvancedRandomizedQuestions(
  questions: QuizQuestion[],
  userClickPattern: number[] = []
): QuizQuestion[] {
  console.log('🎯 Creating randomized questions, pattern length:', userClickPattern.length);
  
  // Detect if user has a pattern (clicking same position repeatedly)
  const isRepetitive = userClickPattern.length >= 3 &&
    userClickPattern.slice(-3).every(pos => pos === userClickPattern[userClickPattern.length - 1]);

  return [...questions].map((question, questionIndex) => {
    let shuffledOptions = [...question.options];

    if (isRepetitive) {
      console.log('🎯 Repetitive pattern detected, applying countermeasures');
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

    // Add slight point variations to prevent identical scores (20% chance instead of 10%)
    // if (Math.random() > 0.8) {
    //   console.log('🎯 Adding point variations to question', questionIndex + 1);
    //   shuffledOptions = shuffledOptions.map(option => {
    //     const variation = Math.random() > 0.5 ? 1 : -1;
    //     const newPoints = Math.max(1, Math.min(5, option.points + variation)); // Keep between 1-5 points
    //     return { ...option, points: newPoints };
    //   });
    // }

    return {
      ...question,
      options: shuffledOptions
    };
  }).sort(() => Math.random() - 0.5); // Always shuffle question order
}

function canonicalizeArchetype(a?: string): Archetype | null {
  if (!a) return null
  const norm = a.trim().toLowerCase()
  const found = ARCHETYPES.find(x => x.toLowerCase() === norm)
  return (found ?? null) as Archetype | null
}

/**
 * Enhanced quiz scoring with better tie-breaking
 */
export function calculateQuizScores(answers: Record<number, QuizAnswer>): QuizScores {
  const scores: QuizScores = { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 }

  console.log('[calculateQuizScores] answers ->', answers)

  for (const [key, ans] of Object.entries(answers)) {
    const arch = ans?.archetype?.trim()
    const pts = Number(ans?.points ?? 0)
    console.log(`  · Q${key}: archetype=${arch} points=${pts}`)

    if (!arch || !(arch in scores)) {
      console.warn(`  ⚠️ invalid archetype for Q${key}:`, ans)
      continue
    }
    if (Number.isNaN(pts)) {
      console.warn(`  ⚠️ NaN points for Q${key}:`, ans)
      continue
    }
    // @ts-expect-error narrowing above guarantees key exists
    scores[arch] += pts
  }

  console.log('[calculateQuizScores] scores ->', scores)
  return scores
}


/**
 * Enhanced winner determination with proper tie-breaking
 */
// replace your current getWinningArchetype with this deterministic version
export function getWinningArchetype(
  scores: QuizScores,
  answers?: Record<number, QuizAnswer>
): Archetype {
  // 1) if everything is zero, fail loudly so we can fix the root cause
  const values = Object.values(scores)
  const allZero = values.every(v => Number(v) === 0)
  if (allZero) {
    throw new Error(
      `[getWinningArchetype] All scores are 0. Upstream issue: answers missing points/archetypes.`
    )
  }

  // 2) pick the max score
  const maxScore = Math.max(...values)
  const tied = (Object.keys(scores) as Archetype[]).filter(a => scores[a] === maxScore)

  if (tied.length === 1) return tied[0]

  // 3) tie-breaker #1: who appears more in answers
  const counts: Record<Archetype, number> = { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 }
  if (answers) {
    for (const a of Object.values(answers)) {
      const arch = a?.archetype?.trim() as Archetype
      if (arch && counts[arch] !== undefined) counts[arch] += 1
    }
  }
  const maxCount = Math.max(...tied.map(a => counts[a]))
  const countWinners = tied.filter(a => counts[a] === maxCount)
  if (countWinners.length === 1) return countWinners[0]

  // 4) final tie-break: fixed order so it’s predictable
  const ORDER: Archetype[] = ['Avoider', 'Gambler', 'Realist', 'Architect']
  for (const a of ORDER) {
    if (countWinners.includes(a)) return a
  }
  // should never get here, but keep a safe default
  return ORDER[0]
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
  const isRepetitive = lastFour.filter(pos => pos === lastFour[0]).length >= 3;
  
  if (isRepetitive) {
    console.log('🎯 Repetitive clicking pattern detected:', lastFour);
  }
  
  return isRepetitive;
}

/**
 * Generates session ID for quiz submission
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  return `${timestamp}-${randomPart}`;
}

/**
 * Analyze quiz result distribution to detect bias
 */
export function analyzeQuizBias(results: Array<{archetype: string}>) {
  const counts = results.reduce((acc, result) => {
    acc[result.archetype] = (acc[result.archetype] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const total = results.length;
  const analysis = Object.entries(counts).map(([archetype, count]) => ({
    archetype,
    count,
    percentage: ((count / total) * 100).toFixed(1),
    expected: (total / 4).toFixed(1),
    bias: count - (total / 4)
  }));
  
  console.log('🎯 Quiz Result Distribution Analysis:', analysis);
  return analysis;
}

/**
 * Validate quiz balance - ensure each archetype has equal opportunity
 */
export function validateQuizBalance(questions: QuizQuestion[]) {
  const archetypePoints = { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 };
  const archetypeQuestions = { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 };
  
  questions.forEach(question => {
    question.options.forEach(option => {
      archetypePoints[option.archetype] += option.points;
      archetypeQuestions[option.archetype]++;
    });
  });
  
  console.log('🎯 Quiz Balance Analysis:');
  console.log('Total possible points per archetype:', archetypePoints);
  console.log('Total questions per archetype:', archetypeQuestions);
  
  // Check if balanced
  const pointValues = Object.values(archetypePoints);
  const questionValues = Object.values(archetypeQuestions);
  
  const pointsBalanced = pointValues.every(points => points === pointValues[0]);
  const questionsBalanced = questionValues.every(count => count === questionValues[0]);
  
  if (!pointsBalanced || !questionsBalanced) {
    console.warn('🎯 QUIZ IMBALANCE DETECTED!');
    console.warn('Points balanced:', pointsBalanced);
    console.warn('Questions balanced:', questionsBalanced);
  }
  
  return { pointsBalanced, questionsBalanced, archetypePoints, archetypeQuestions };
}