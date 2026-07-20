// hooks/useQuizState.ts — server-persisted shuffle (WAS-107)
import { useState } from 'react';
import { QuizQuestion, QuizAnswer } from '@/types/quiz';
import { QuizService } from '@/lib/quiz';
import { logger } from '@/lib/logger';

export function useQuizState() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, QuizAnswer>>({});
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [clickPattern, setClickPattern] = useState<number[]>([]);
  const [archetypeDistribution, setArchetypeDistribution] = useState({
    Avoider: 0,
    Gambler: 0,
    Realist: 0,
    Architect: 0
  });

  const startQuiz = async () => {
    setIsStarting(true);
    setStartError(null);
    try {
      const { sessionId: newSessionId, questions } = await QuizService.startQuiz();
      setSessionId(newSessionId);
      setShuffledQuestions(questions);
      setShowWelcome(false);
      setCurrentQuestion(0);
      setQuizAnswers({});
      setClickPattern([]);
      setArchetypeDistribution({ Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 });
    } catch (e) {
      logger.error('Failed to start quiz attempt', e);
      setStartError(e instanceof Error ? e.message : 'Failed to start quiz');
    } finally {
      setIsStarting(false);
    }
  };

  const goBackOne = () => {
    if (currentQuestion <= 0) return;
    const lastIndex = currentQuestion - 1;

    const newPattern = [...clickPattern];
    newPattern.pop();
    setClickPattern(newPattern);

    const prev = quizAnswers[lastIndex];
    if (prev && prev.archetype && archetypeDistribution[prev.archetype] !== undefined) {
      setArchetypeDistribution({
        ...archetypeDistribution,
        [prev.archetype]: Math.max(0, archetypeDistribution[prev.archetype] - 1)
      });
    }

    const newAnswers = { ...quizAnswers } as Record<number, QuizAnswer>;
    delete newAnswers[lastIndex];
    setQuizAnswers(newAnswers);

    setCurrentQuestion(lastIndex);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setQuizAnswers({});
    setShowWelcome(true);
    setClickPattern([]);
    setArchetypeDistribution({ Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 });
    setShuffledQuestions([]);
    setSessionId(null);
    setStartError(null);
  };

  const hardReset = () => {
    resetQuiz();
  };

  const handleQuizAnswer = (answer: QuizAnswer): boolean => {
    const optionIndex = shuffledQuestions[currentQuestion]?.options.findIndex(opt =>
      opt.id === answer.id || opt.text === answer.text
    ) || 0;

    const newClickPattern = [...clickPattern, optionIndex];
    setClickPattern(newClickPattern);

    const newDistribution = { ...archetypeDistribution };
    newDistribution[answer.archetype as keyof typeof newDistribution]++;
    setArchetypeDistribution(newDistribution);

    // Layout is frozen at start (WAS-107) — mid-quiz anti-pattern reshuffles
    // would change the shown options without updating the persisted attempt.

    const enhancedAnswer = {
      ...answer,
      question: shuffledQuestions[currentQuestion]?.text || shuffledQuestions[currentQuestion]?.question,
    };

    const newAnswers = { ...quizAnswers, [currentQuestion]: enhancedAnswer };
    setQuizAnswers(newAnswers);

    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      return false;
    }
    return true;
  };

  return {
    currentQuestion,
    answers: quizAnswers,
    shuffledQuestions,
    sessionId,
    showWelcome,
    clickPattern,
    archetypeDistribution,
    isStarting,
    startError,

    isQuizComplete: shuffledQuestions.length > 0 && currentQuestion >= shuffledQuestions.length,
    totalQuestions: shuffledQuestions.length,
    currentQuestionData: shuffledQuestions[currentQuestion],

    startQuiz,
    resetQuiz,
    hardReset,
    handleQuizAnswer,
    goBackOne,
    setShowWelcome,
    setCurrentQuestion,
  };
}
