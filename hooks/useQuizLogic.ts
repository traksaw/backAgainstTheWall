// hooks/useQuizLogic.ts
import { QuizAnswer, QuizSubmissionData, Archetype } from '@/types/quiz';
import { calculateQuizScores, getWinningArchetype, generateSessionId } from '@/lib/quiz/utils';

export function useQuizLogic() {

  /**
   * Process quiz completion and generate submission data
   */
  const processQuizCompletion = (answers: Record<number, QuizAnswer>): QuizSubmissionData => {
    const sessionId = generateSessionId()
    const scores = calculateQuizScores(answers)
    const winningArchetype = getWinningArchetype(scores, answers)
    const totalScore = scores[winningArchetype]

    if (!winningArchetype || totalScore === undefined) {
      throw new Error(`Invalid quiz calculation - archetype: ${winningArchetype}, score: ${totalScore}`)
    }

    return {
      answers,
      sessionId,
      archetype: winningArchetype,
      score: totalScore,
      scores,
    } satisfies QuizSubmissionData
  }

  /**
   * Validate quiz answers before submission
   */
  const validateQuizAnswers = (answers: Record<number, QuizAnswer>): boolean => {
    const answerCount = Object.keys(answers).length;
    if (answerCount === 0) {
      throw new Error('No answers provided');
    }

    // Check that all answers have required fields
    for (const answer of Object.values(answers)) {
      if (!answer.archetype || !answer.points || !answer.text) {
        throw new Error('Invalid answer format');
      }
    }

    return true;
  };

  /**
   * Get archetype distribution from answers
   */
  const getArchetypeDistribution = (answers: Record<number, QuizAnswer>): Record<Archetype, number> => {
    const distribution: Record<Archetype, number> = {
      Avoider: 0,
      Gambler: 0,
      Realist: 0,
      Architect: 0
    };

    Object.values(answers).forEach(answer => {
      if (answer.archetype) {
        distribution[answer.archetype]++;
      }
    });

    return distribution;
  };

  /**
   * Calculate completion percentage
   */
  const getCompletionPercentage = (currentQuestion: number, totalQuestions: number): number => {
    if (totalQuestions === 0) return 0;
    return Math.round(((currentQuestion + 1) / totalQuestions) * 100);
  };

  /**
   * Check if quiz is ready for submission
   */
  const isReadyForSubmission = (answers: Record<number, QuizAnswer>, totalQuestions: number): boolean => {
    return Object.keys(answers).length === totalQuestions;
  };

  return {
    processQuizCompletion,
    validateQuizAnswers,
    getArchetypeDistribution,
    getCompletionPercentage,
    isReadyForSubmission,
  };
}