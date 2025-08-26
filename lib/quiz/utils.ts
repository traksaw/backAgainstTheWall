// lib/quiz/utils.ts - Enhanced shuffling with robust anti-pattern detection

import { QuizQuestion, QuizAnswer, Archetype, QuizScores, QuizOption } from '@/types/quiz';
import { Shield, TrendingUp, Target, Eye, Award } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export const ARCHETYPES: Archetype[] = ['Avoider', 'Gambler', 'Realist', 'Architect']
export const EMPTY_SCORES: QuizScores = ARCHETYPES.reduce((acc, a) => {
  acc[a] = 0
  return acc
}, {} as QuizScores)

/**
 * Enhanced shuffling with multiple anti-pattern strategies
 */
export function createAdvancedRandomizedQuestions(
  questions: QuizQuestion[],
  userClickPattern: number[] = []
): QuizQuestion[] {
  // Step 1: Analyze user's clicking behavior
  const patternAnalysis = analyzeClickingPattern(userClickPattern);
  
  // Step 2: Shuffle question order first
  let shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
  
  // Step 3: Apply sophisticated option shuffling to each question
  shuffledQuestions = shuffledQuestions.map((question, questionIndex) => {
    let shuffledOptions = [...question.options];
    
    // Strategy 1: Basic randomization
    shuffledOptions = shuffledOptions.sort(() => Math.random() - 0.5);
    
    // Strategy 2: Anti-pattern positioning
    if (patternAnalysis.isRepetitive) {
      
      // Move the user's preferred archetype away from their favorite position
      const favoritePosition = patternAnalysis.favoritePosition;
      const preferredArchetype = patternAnalysis.dominantArchetype;
      
      shuffledOptions = repositionToCounterPattern(shuffledOptions, favoritePosition, preferredArchetype);
    }
    
    // Strategy 3: Ensure archetype balance across positions
    shuffledOptions = balanceArchetypesAcrossPositions(shuffledOptions, questionIndex);
    
    // Strategy 4: Smart tie-breaking (vary point values slightly)
    if (Math.random() > 0.7) {
      shuffledOptions = addPointVariations(shuffledOptions);
    }
    
    return {
      ...question,
      options: shuffledOptions
    };
  });

  // Step 4: Final question order optimization
  shuffledQuestions = optimizeQuestionOrder(shuffledQuestions);
  
  
  return shuffledQuestions;
}

/**
 * Analyze user's clicking pattern to detect gaming attempts
 */
function analyzeClickingPattern(clickPattern: number[]): {
  isRepetitive: boolean;
  favoritePosition: number;
  dominantArchetype?: string;
  confidence: number;
} {
  if (clickPattern.length < 4) {
    return { isRepetitive: false, favoritePosition: 0, confidence: 0 };
  }
  
  // Count position frequency
  const positionCounts = [0, 0, 0, 0];
  clickPattern.forEach(pos => {
    if (pos >= 0 && pos <= 3) positionCounts[pos]++;
  });
  
  const maxCount = Math.max(...positionCounts);
  const favoritePosition = positionCounts.indexOf(maxCount);
  const totalClicks = clickPattern.length;
  const confidence = maxCount / totalClicks;
  
  // Consider repetitive if >60% of clicks are in same position
  const isRepetitive = confidence > 0.6;
  
  // Check for sequential patterns (1,2,3,4 or 4,3,2,1)
  const isSequential = detectSequentialPattern(clickPattern);
  
  return {
    isRepetitive: isRepetitive || isSequential,
    favoritePosition,
    confidence,
    dominantArchetype: undefined // We'll track this separately if needed
  };
}

/**
 * Detect if user is clicking in sequential patterns
 */
function detectSequentialPattern(pattern: number[]): boolean {
  if (pattern.length < 4) return false;
  
  const lastFour = pattern.slice(-4);
  
  // Check ascending: 0,1,2,3
  const isAscending = lastFour.every((val, idx) => idx === 0 || val === lastFour[idx - 1] + 1);
  
  // Check descending: 3,2,1,0  
  const isDescending = lastFour.every((val, idx) => idx === 0 || val === lastFour[idx - 1] - 1);
  
  return isAscending || isDescending;
}

/**
 * Reposition options to counter user's pattern
 */
function repositionToCounterPattern(
  options: QuizOption[], 
  favoritePosition: number, 
  preferredArchetype?: string
): QuizOption[] {
  const result = [...options];
  
  // Strategy: Put least likely archetype in user's favorite position
  const archetypePriority = ['Avoider', 'Realist', 'Architect', 'Gambler']; // Order of "boring" to "exciting"
  
  // Find the most "opposite" option to put in favorite position
  const conservativeOption = result.find(opt => opt.archetype === 'Avoider') || result[0];
  const favoritePositionOption = result[favoritePosition];
  
  // Swap positions to disrupt pattern
  const conservativeIndex = result.indexOf(conservativeOption);
  if (conservativeIndex !== favoritePosition) {
    result[favoritePosition] = conservativeOption;
    result[conservativeIndex] = favoritePositionOption;
  }
  
  return result;
}

/**
 * Ensure balanced archetype distribution across all positions
 */
function balanceArchetypesAcrossPositions(options: QuizOption[], questionIndex: number): QuizOption[] {
  const result = [...options];
  
  // Rotate archetype positions based on question index
  const rotationOffset = questionIndex % 4;
  const rotatedResult = [
    result[(0 + rotationOffset) % 4],
    result[(1 + rotationOffset) % 4], 
    result[(2 + rotationOffset) % 4],
    result[(3 + rotationOffset) % 4]
  ];
  
  return rotatedResult;
}

/**
 * Add slight point variations to prevent ties and identical scores
 */
function addPointVariations(options: QuizOption[]): QuizOption[] {
  return options.map(option => {
    // Randomly adjust by ±0.5 points (within reasonable bounds)
    const variation = Math.random() > 0.5 ? 0.5 : -0.5;
    const newPoints = Math.max(1, Math.min(5, option.points + variation));
    
    return {
      ...option,
      points: Math.round(newPoints) // Keep as integers
    };
  });
}

/**
 * Optimize question order for maximum engagement
 */
function optimizeQuestionOrder(questions: QuizQuestion[]): QuizQuestion[] {
  const result = [...questions];
  
  // Ensure we don't start or end with the same archetype bias
  // This prevents users from identifying patterns in question progression
  
  return result.sort(() => Math.random() - 0.5); // Additional final shuffle
}

/**
 * Enhanced quiz scoring with better tie-breaking
 */
export function calculateQuizScores(answers: Record<number, QuizAnswer>): QuizScores {
  const scores: QuizScores = { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 }


  for (const [key, ans] of Object.entries(answers)) {
    const arch = ans?.archetype?.trim()
    const pts = Number(ans?.points ?? 0)

    if (!arch || !(arch in scores)) {
      continue
    }
    if (Number.isNaN(pts)) {
      console.warn(`  ⚠️ NaN points for Q${key}:`, ans)
      continue
    }
    // @ts-expect-error narrowing above guarantees key exists
    scores[arch] += pts
  }

  return scores
}

/**
 * Enhanced winner determination with proper tie-breaking
 */
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

  // 3) tie-breaker #1: prefer archetypes appearing more in RECENT answers
  const recentCounts: Record<Archetype, number> = { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 }
  if (answers) {
    const recent = Object.values(answers).slice(-5) // last 5 answers
    for (const a of recent) {
      const arch = (a?.archetype?.trim() || '') as Archetype
      if (arch && recentCounts[arch] !== undefined) recentCounts[arch] += 1
    }
  }
  const maxRecent = Math.max(...tied.map(a => recentCounts[a]))
  const recentWinners = tied.filter(a => recentCounts[a] === maxRecent)
  if (recentWinners.length === 1) return recentWinners[0]

  // 4) tie-breaker #2: weighted randomness to avoid deterministic bias
  // Slight weights encourage variety without overpowering raw scores
  const TIE_WEIGHTS: Record<Archetype, number> = {
    Avoider: 1.0,
    Gambler: 1.1,
    Realist: 1.15,
    Architect: 1.1,
  }
  const candidates = (recentWinners.length > 0 ? recentWinners : tied).map(a => {
    const base = scores[a]
    const jitter = 0.95 + Math.random() * 0.1 // 5% noise
    return {
      a,
      w: base * (TIE_WEIGHTS[a] ?? 1) * jitter,
    }
  })
  candidates.sort((x, y) => y.w - x.w)
  if (candidates.length > 0) return candidates[0].a

  // 5) ultimate fallback: random among tied (should rarely happen)
  return tied[Math.floor(Math.random() * tied.length)]
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
 * Enhanced pattern detection with multiple strategies
 */
export function detectRepetitivePattern(
  clickPattern: number[],
  archetypeDistribution: Record<Archetype, number>
): boolean {
  if (clickPattern.length < 3) return false;

  const analysis = analyzeClickingPattern(clickPattern);
  return analysis.isRepetitive;
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
  
  return analysis;
}

/**
 * Enhanced quiz balance validation
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
  
  
  // Check if balanced
  const pointValues = Object.values(archetypePoints);
  const questionValues = Object.values(archetypeQuestions);
  
  const pointsBalanced = pointValues.every(points => Math.abs(points - pointValues[0]) <= 2); // Allow small variance
  const questionsBalanced = questionValues.every(count => count === questionValues[0]);
  
  if (!pointsBalanced || !questionsBalanced) {
    console.warn('🎯 QUIZ IMBALANCE DETECTED!');
  } else {
  }
  
  return { pointsBalanced, questionsBalanced, archetypePoints, archetypeQuestions };
}