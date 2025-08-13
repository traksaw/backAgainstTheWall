// lib/quiz/utils.ts - Updated version with enhanced scoring

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
    if (Math.random() > 0.8) {
      console.log('🎯 Adding point variations to question', questionIndex + 1);
      shuffledOptions = shuffledOptions.map(option => {
        const variation = Math.random() > 0.5 ? 1 : -1;
        const newPoints = Math.max(1, Math.min(5, option.points + variation)); // Keep between 1-5 points
        return { ...option, points: newPoints };
      });
    }

    return {
      ...question,
      options: shuffledOptions
    };
  }).sort(() => Math.random() - 0.5); // Always shuffle question order
}

/**
 * Enhanced quiz scoring with better tie-breaking
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

  console.log('🎯 Raw archetype scores:', scores);
  return scores;
}

/**
 * Enhanced winner determination with proper tie-breaking
 */
export function getWinningArchetype(scores: Record<Archetype, number>, answers?: Record<number, QuizAnswer>): Archetype {
  console.log('🎯 Determining winner from scores:', scores);
  
  // Get sorted entries by score
  const sortedEntries = Object.entries(scores).sort(([,a], [,b]) => b - a);
  const highestScore = sortedEntries[0][1];
  const tiedArchetypes = sortedEntries.filter(([,score]) => score === highestScore).map(([archetype]) => archetype);
  
  console.log('🎯 Highest score:', highestScore);
  console.log('🎯 Tied archetypes:', tiedArchetypes);
  
  // If no tie, return the winner
  if (tiedArchetypes.length === 1) {
    const winner = tiedArchetypes[0] as Archetype;
    console.log('🎯 Clear winner:', winner);
    return winner;
  }
  
  // Handle ties with advanced logic
  console.log('🎯 TIE DETECTED - applying tie-breaking logic');
  
  // Method 1: Check recent answer patterns (last 30% of answers)
  if (answers) {
    const answerValues = Object.values(answers);
    const recentCount = Math.max(3, Math.floor(answerValues.length * 0.3));
    const recentAnswers = answerValues.slice(-recentCount);
    
    const recentScores: Record<string, number> = {};
    tiedArchetypes.forEach(archetype => { recentScores[archetype] = 0; });
    
    recentAnswers.forEach(answer => {
      if (answer.archetype && tiedArchetypes.includes(answer.archetype)) {
        recentScores[answer.archetype]++;
      }
    });
    
    console.log('🎯 Recent answer bias:', recentScores);
    
    const recentWinner = Object.entries(recentScores)
      .filter(([archetype]) => tiedArchetypes.includes(archetype))
      .sort(([,a], [,b]) => b - a)[0];
    
    if (recentWinner && recentWinner[1] > 0) {
      const winner = recentWinner[0] as Archetype;
      console.log('🎯 Tie broken by recent answers:', winner);
      return winner;
    }
  }
  
  // Method 2: Weighted randomness with slight archetype preferences
  const tieBreakingWeights = {
    Avoider: 1.0,
    Gambler: 1.05,   // Slight preference for risk-takers (more interesting)
    Realist: 1.1,    // Preference for balanced approach (most relatable)
    Architect: 1.08  // Preference for planners
  };
  
  // Add controlled randomness (±5%)
  const weightedScores = tiedArchetypes.map(archetype => ({
    archetype,
    weightedScore: scores[archetype as Archetype] * 
                  tieBreakingWeights[archetype as Archetype] * 
                  (0.95 + Math.random() * 0.1) // 5% randomness
  }));
  
  const finalWinner = weightedScores.sort((a, b) => b.weightedScore - a.weightedScore)[0];
  const winner = finalWinner.archetype as Archetype;
  
  console.log('🎯 Tie broken by weighted selection:', winner, 'score:', finalWinner.weightedScore);
  return winner;
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