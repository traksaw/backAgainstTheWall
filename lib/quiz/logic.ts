// lib/quiz/logic.ts
import type { 
  QuizQuestion, 
  QuizAnswer, 
  Archetype, 
  QuizScores,
  QuizValidationResult,
  PatternDetectionResult,
  QuizAnalytics,
  QuizConfiguration
} from './types'

/**
 * Advanced quiz logic and analysis functions
 */

/**
 * Default quiz configuration
 */
export const DEFAULT_QUIZ_CONFIG: QuizConfiguration = {
  totalQuestions: 15,
  pointsPerQuestion: 3,
  shuffleQuestions: true,
  shuffleOptions: true,
  antiPatternDetection: true
}

/**
 * Validate quiz answers comprehensively
 */
export function validateQuizAnswers(
  answers: Record<number, QuizAnswer>,
  config: QuizConfiguration = DEFAULT_QUIZ_CONFIG
): QuizValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check answer count
  const answerCount = Object.keys(answers).length
  if (answerCount === 0) {
    errors.push('No answers provided')
  }
  
  if (answerCount < config.totalQuestions) {
    warnings.push(`Only ${answerCount} of ${config.totalQuestions} questions answered`)
  }
  
  // Validate each answer
  for (const [questionIndex, answer] of Object.entries(answers)) {
    const index = parseInt(questionIndex)
    
    if (!answer.archetype) {
      errors.push(`Question ${index + 1}: Missing archetype`)
    }
    
    if (!answer.points || answer.points <= 0) {
      errors.push(`Question ${index + 1}: Invalid points value`)
    }
    
    if (!answer.text) {
      errors.push(`Question ${index + 1}: Missing answer text`)
    }
    
    // Check for valid archetype
    const validArchetypes: Archetype[] = ['Avoider', 'Gambler', 'Realist', 'Architect']
    if (answer.archetype && !validArchetypes.includes(answer.archetype)) {
      errors.push(`Question ${index + 1}: Invalid archetype "${answer.archetype}"`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Calculate detailed quiz scores
 */
export function calculateDetailedScores(answers: Record<number, QuizAnswer>): {
  scores: QuizScores
  percentages: QuizScores
  winner: Archetype
  totalPoints: number
} {
  const scores: QuizScores = {
    Avoider: 0,
    Gambler: 0,
    Realist: 0,
    Architect: 0
  }
  
  let totalPoints = 0
  
  // Calculate raw scores
  Object.values(answers).forEach(answer => {
    if (answer.archetype && answer.points) {
      scores[answer.archetype] += answer.points
      totalPoints += answer.points
    }
  })
  
  // Calculate percentages
  const percentages: QuizScores = {
    Avoider: totalPoints > 0 ? (scores.Avoider / totalPoints) * 100 : 0,
    Gambler: totalPoints > 0 ? (scores.Gambler / totalPoints) * 100 : 0,
    Realist: totalPoints > 0 ? (scores.Realist / totalPoints) * 100 : 0,
    Architect: totalPoints > 0 ? (scores.Architect / totalPoints) * 100 : 0
  }
  
  // Find winner
  const winner = (Object.entries(scores).reduce((a, b) => 
    a[1] > b[1] ? a : b
  )[0]) as Archetype
  
  return {
    scores,
    percentages,
    winner,
    totalPoints
  }
}

/**
 * Detect user clicking patterns
 */
export function detectClickPattern(clickPattern: number[]): PatternDetectionResult {
  if (clickPattern.length < 3) {
    return {
      isRepetitive: false,
      patternType: 'random',
      confidence: 0,
      suggestedAction: 'none'
    }
  }
  
  // Check for same-position clicking
  const lastThree = clickPattern.slice(-3)
  const samePosition = lastThree.every(pos => pos === lastThree[0])
  
  if (samePosition) {
    return {
      isRepetitive: true,
      patternType: 'same-position',
      confidence: 0.9,
      suggestedAction: 'shuffle'
    }
  }
  
  // Check for sequential pattern (0,1,2,3,0,1,2,3...)
  const isSequential = clickPattern.length >= 4 && 
    clickPattern.slice(-4).every((pos, idx) => pos === idx % 4)
  
  if (isSequential) {
    return {
      isRepetitive: true,
      patternType: 'sequential',
      confidence: 0.8,
      suggestedAction: 'reorder'
    }
  }
  
  // Check for alternating pattern (0,1,0,1 or 2,3,2,3...)
  const lastFour = clickPattern.slice(-4)
  const isAlternating = lastFour.length === 4 && 
    lastFour[0] === lastFour[2] && 
    lastFour[1] === lastFour[3] && 
    lastFour[0] !== lastFour[1]
  
  if (isAlternating) {
    return {
      isRepetitive: true,
      patternType: 'alternating',
      confidence: 0.7,
      suggestedAction: 'warn'
    }
  }
  
  return {
    isRepetitive: false,
    patternType: 'random',
    confidence: 0.1,
    suggestedAction: 'none'
  }
}

/**
 * Generate quiz analytics
 */
export function generateQuizAnalytics(
  answers: Record<number, QuizAnswer>,
  clickPattern: number[],
  startTime: Date,
  endTime: Date
): QuizAnalytics {
  const completionTime = endTime.getTime() - startTime.getTime()
  const averageResponseTime = completionTime / Object.keys(answers).length
  
  // Calculate archetype distribution
  const archetypeDistribution: Record<string, number> = {}
  Object.values(answers).forEach(answer => {
    if (answer.archetype) {
      archetypeDistribution[answer.archetype] = 
        (archetypeDistribution[answer.archetype] || 0) + 1
    }
  })
  
  // Find questions that might have been confusing (longer response times)
  const repeatQuestionIndices: number[] = []
  // This would be more complex with actual timing data
  
  return {
    completionTime,
    clickPattern,
    archetypeDistribution,
    repeatQuestionIndices,
    averageResponseTime
  }
}

/**
 * Apply anti-pattern countermeasures to questions
 */
export function applyAntiPatternMeasures(
  questions: QuizQuestion[],
  patternResult: PatternDetectionResult,
  archetypeDistribution: Record<string, number>
): QuizQuestion[] {
  if (!patternResult.isRepetitive) {
    return questions
  }
  
  return questions.map(question => {
    let modifiedOptions = [...question.options]
    
    switch (patternResult.suggestedAction) {
      case 'shuffle':
        // Aggressive shuffling
        modifiedOptions = modifiedOptions.sort(() => Math.random() - 0.5)
        
        // Ensure different archetypes in commonly clicked positions
        const sortedArchetypes = Object.entries(archetypeDistribution)
          .sort(([,a], [,b]) => a - b) // Sort by count (ascending)
        
        // Place less-chosen archetypes in preferred positions
        if (sortedArchetypes.length > 0) {
          const leastChosen = sortedArchetypes[0][0]
          const leastChosenOption = modifiedOptions.find(opt => opt.archetype === leastChosen)
          
          if (leastChosenOption) {
            // Move to first position
            modifiedOptions = modifiedOptions.filter(opt => opt !== leastChosenOption)
            modifiedOptions.unshift(leastChosenOption)
          }
        }
        break
        
      case 'reorder':
        // Reverse the order
        modifiedOptions = modifiedOptions.reverse()
        break
        
      case 'warn':
        // Add slight point variations
        modifiedOptions = modifiedOptions.map(option => ({
          ...option,
          points: Math.max(1, option.points + (Math.random() > 0.5 ? 1 : -1))
        }))
        break
        
      default:
        // No action needed
        break
    }
    
    return {
      ...question,
      options: modifiedOptions
    }
  })
}

/**
 * Generate session fingerprint for analytics
 */
export function generateSessionFingerprint(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  const userAgent = typeof window !== 'undefined' ? 
    window.navigator.userAgent.slice(0, 20) : 'server'
  
  return `${timestamp}-${random}-${btoa(userAgent).slice(0, 8)}`
}