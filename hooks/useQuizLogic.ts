// hooks/useQuizLogic.ts - Enhanced version with better scoring
import { useState, useCallback, useMemo } from 'react';
import { QuizAnswer, QuizSubmissionData, Archetype } from '@/types/quiz';
import { calculateQuizScores, getWinningArchetype, generateSessionId } from '@/lib/quiz/utils';

interface QuizState {
  answers: Record<number, QuizAnswer>;
  currentQuestion: number;
  isComplete: boolean;
  submissionData: QuizSubmissionData | null;
}

interface QuizMetrics {
  totalAnswers: number;
  answerBreakdown: Record<string, number>;
  diversityScore: number;
  averageConfidence: number;
}

export function useQuizLogic() {
  const [quizState, setQuizState] = useState<QuizState>({
    answers: {},
    currentQuestion: 0,
    isComplete: false,
    submissionData: null,
  });

  /**
   * Add or update an answer for a specific question
   */
  const setAnswer = useCallback((questionIndex: number, answer: QuizAnswer) => {
    setQuizState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionIndex]: answer
      }
    }));
  }, []);

  /**
   * Navigate to the next question
   */
  const nextQuestion = useCallback(() => {
    setQuizState(prev => ({
      ...prev,
      currentQuestion: prev.currentQuestion + 1
    }));
  }, []);

  /**
   * Navigate to the previous question
   */
  const previousQuestion = useCallback(() => {
    setQuizState(prev => ({
      ...prev,
      currentQuestion: Math.max(0, prev.currentQuestion - 1)
    }));
  }, []);

  /**
   * Jump to a specific question
   */
  const goToQuestion = useCallback((questionIndex: number) => {
    setQuizState(prev => ({
      ...prev,
      currentQuestion: questionIndex
    }));
  }, []);

  /**
   * Calculate quiz metrics for analysis
   */
  const calculateMetrics = useCallback((answers: Record<number, QuizAnswer>): QuizMetrics => {
    const totalAnswers = Object.keys(answers).length;
    
    // Calculate answer breakdown by archetype
    const answerBreakdown = Object.values(answers).reduce((acc, answer) => {
      acc[answer.archetype] = (acc[answer.archetype] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate diversity score (how varied the answers were)
    // Higher score = more diverse answers across archetypes
    const archetypeCount = Object.keys(answerBreakdown).length;
    const maxPossibleDiversity = Math.min(totalAnswers, Object.values(Archetype).length);
    const diversityScore = totalAnswers > 0 ? (archetypeCount / maxPossibleDiversity) * 100 : 0;
    
    // Calculate average confidence if answers have confidence scores
    const confidenceScores = Object.values(answers)
      .map(answer => answer.confidence)
      .filter(confidence => confidence !== undefined) as number[];
    
    const averageConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
      : 0;

    return {
      totalAnswers,
      answerBreakdown,
      diversityScore,
      averageConfidence
    };
  }, []);

  /**
   * Process quiz completion and generate submission data
   */
  const processQuizCompletion = useCallback((answers: Record<number, QuizAnswer>): QuizSubmissionData => {
    const sessionId = generateSessionId();
    console.log('🎯 Processing quiz completion...');
    console.log('🎯 Total answers received:', Object.keys(answers).length);
    
    // Log individual answers for debugging
    Object.entries(answers).forEach(([questionIndex, answer]) => {
      console.log(`🎯 Q${parseInt(questionIndex) + 1}: ${answer.archetype} (${answer.points} pts) - "${answer.text}"`);
    });
    
    // Calculate scores for each archetype
    const scores = calculateQuizScores(answers);
    console.log('🎯 Calculated scores:', scores);
    
    // Get winning archetype with enhanced tie-breaking
    const winningArchetype = getWinningArchetype(scores, answers);
    const totalScore = scores[winningArchetype];
    console.log('🎯 Winner determined:', winningArchetype, 'with score:', totalScore);
    
    // Calculate comprehensive metrics
    const metrics = calculateMetrics(answers);
    console.log('🎯 Quiz metrics:', metrics);
    
    // Create submission data
    const submissionData: QuizSubmissionData = {
      sessionId,
      answers,
      scores,
      winningArchetype,
      totalScore,
      metrics,
      completedAt: new Date().toISOString(),
      timeToComplete: Date.now(), // You might want to track actual start time
    };

    return submissionData;
  }, [calculateMetrics]);

  /**
   * Complete the quiz and generate final results
   */
  const completeQuiz = useCallback(() => {
    const submissionData = processQuizCompletion(quizState.answers);
    
    setQuizState(prev => ({
      ...prev,
      isComplete: true,
      submissionData
    }));

    return submissionData;
  }, [quizState.answers, processQuizCompletion]);

  /**
   * Reset the quiz to initial state
   */
  const resetQuiz = useCallback(() => {
    setQuizState({
      answers: {},
      currentQuestion: 0,
      isComplete: false,
      submissionData: null,
    });
  }, []);

  /**
   * Check if a specific question has been answered
   */
  const isQuestionAnswered = useCallback((questionIndex: number): boolean => {
    return questionIndex in quizState.answers;
  }, [quizState.answers]);

  /**
   * Get the answer for a specific question
   */
  const getAnswer = useCallback((questionIndex: number): QuizAnswer | undefined => {
    return quizState.answers[questionIndex];
  }, [quizState.answers]);

  /**
   * Calculate progress percentage
   */
  const progress = useMemo(() => {
    const totalQuestions = Object.keys(quizState.answers).length;
    return totalQuestions > 0 ? (Object.keys(quizState.answers).length / totalQuestions) * 100 : 0;
  }, [quizState.answers]);

  /**
   * Get current quiz metrics without completing
   */
  const currentMetrics = useMemo(() => {
    return calculateMetrics(quizState.answers);
  }, [quizState.answers, calculateMetrics]);

  /**
   * Check if quiz can be completed (minimum answers met)
   */
  const canComplete = useMemo(() => {
    const totalAnswers = Object.keys(quizState.answers).length;
    // Define minimum required answers (adjust as needed)
    const minimumRequiredAnswers = 5;
    return totalAnswers >= minimumRequiredAnswers;
  }, [quizState.answers]);

  return {
    // State
    answers: quizState.answers,
    currentQuestion: quizState.currentQuestion,
    isComplete: quizState.isComplete,
    submissionData: quizState.submissionData,
    
    // Navigation
    nextQuestion,
    previousQuestion,
    goToQuestion,
    
    // Answer management
    setAnswer,
    getAnswer,
    isQuestionAnswered,
    
    // Quiz completion
    completeQuiz,
    resetQuiz,
    processQuizCompletion,
    
    // Metrics and progress
    progress,
    currentMetrics,
    canComplete,
    
    // Utilities
    calculateMetrics,
  };
}