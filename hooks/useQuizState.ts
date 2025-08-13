// hooks/useQuizState.ts - Fixed version
import { useState, useEffect } from 'react';
import { QuizQuestion, QuizAnswer, QuizState, Archetype } from '@/types/quiz';
import { quizQuestions } from '@/lib/quiz/questions';
import { createAdvancedRandomizedQuestions } from '@/lib/quiz/utils';

export function useQuizState() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, QuizAnswer>>({});
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [clickPattern, setClickPattern] = useState<number[]>([]);
  const [archetypeDistribution, setArchetypeDistribution] = useState({
    Avoider: 0,
    Gambler: 0,
    Realist: 0,
    Architect: 0
  });

  // Initialize shuffled questions on mount
  useEffect(() => {
    console.log('🎯 useQuizState: Initializing shuffled questions');
    setShuffledQuestions(createAdvancedRandomizedQuestions(quizQuestions));
  }, []);

  // Start quiz function
  const startQuiz = () => {
    console.log('🎯 useQuizState: Starting quiz');
    setShowWelcome(false);
    setCurrentQuestion(0);
    setQuizAnswers({});
  };

  // Reset quiz function - COMPLETELY reset everything
  const resetQuiz = () => {
    console.log('🎯 useQuizState: Resetting quiz completely');
    
    // Reset all state to initial values
    setCurrentQuestion(0);
    setQuizAnswers({});
    setShowWelcome(true);
    setClickPattern([]);
    setArchetypeDistribution({ Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 });
    
    // Generate completely new shuffled questions
    const newShuffledQuestions = createAdvancedRandomizedQuestions(quizQuestions);
    console.log('🎯 useQuizState: Generated new shuffled questions:', newShuffledQuestions.length);
    setShuffledQuestions(newShuffledQuestions);
  };

  // Hard reset function - for when you want to force a complete restart
  const hardReset = () => {
    console.log('🎯 useQuizState: Hard reset triggered');
    
    // Reset everything immediately
    setCurrentQuestion(0);
    setQuizAnswers({});
    setShowWelcome(true);
    setClickPattern([]);
    setArchetypeDistribution({ Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 });
    
    // Force immediate re-shuffle
    setTimeout(() => {
      const newShuffledQuestions = createAdvancedRandomizedQuestions(quizQuestions);
      console.log('🎯 useQuizState: Hard reset - new questions generated:', newShuffledQuestions.length);
      setShuffledQuestions(newShuffledQuestions);
    }, 0);
  };

  // Handle quiz answer with pattern detection
  const handleQuizAnswer = (answer: QuizAnswer): boolean => {
    console.log('🎯 useQuizState: Handling answer for question', currentQuestion, ':', answer.text);
    
    // Track which position was clicked (0-3)
    const optionIndex = shuffledQuestions[currentQuestion]?.options.findIndex(opt => opt.id === answer.id) || 0;
    const newClickPattern = [...clickPattern, optionIndex];
    setClickPattern(newClickPattern);

    // Track archetype distribution
    const newDistribution = { ...archetypeDistribution };
    newDistribution[answer.archetype as keyof typeof newDistribution]++;
    setArchetypeDistribution(newDistribution);

    // Detect repetitive behavior and counter it
    if (newClickPattern.length >= 4) {
      const lastFour = newClickPattern.slice(-4);
      const isRepetitive = lastFour.filter(pos => pos === lastFour[0]).length >= 3;

      if (isRepetitive) {
        console.log('🎯 useQuizState: Repetitive pattern detected, applying countermeasures');
        // Regenerate remaining questions with anti-pattern logic
        const remainingQuestionCount = shuffledQuestions.length - currentQuestion - 1;
        if (remainingQuestionCount > 0) {
          const currentQuestions = shuffledQuestions.slice(0, currentQuestion + 1);
          const remainingQuestions = shuffledQuestions.slice(currentQuestion + 1);

          // Apply aggressive randomization to remaining questions
          const antiPatternQuestions = remainingQuestions.map(question => {
            const options = [...question.options];

            // Sort so that different archetypes appear in the user's preferred position
            const rearranged = options.sort((a, b) => {
              if (newDistribution[a.archetype as keyof typeof newDistribution] >
                newDistribution[b.archetype as keyof typeof newDistribution]) {
                return 1;
              }
              return Math.random() - 0.5;
            });

            return {
              ...question,
              options: rearranged
            };
          });

          setShuffledQuestions([...currentQuestions, ...antiPatternQuestions]);
        }
      }
    }

    // Add question text to the answer for better history display
    const enhancedAnswer = {
      ...answer,
      question: shuffledQuestions[currentQuestion]?.question,
    };
    const newAnswers = { ...quizAnswers, [currentQuestion]: enhancedAnswer };
    setQuizAnswers(newAnswers);

    // Move to next question or return completion status
    if (currentQuestion < shuffledQuestions.length - 1) {
      const nextQuestion = currentQuestion + 1;
      console.log('🎯 useQuizState: Moving to question', nextQuestion);
      setCurrentQuestion(nextQuestion);
      return false; // Quiz not complete
    } else {
      console.log('🎯 useQuizState: Quiz completed!');
      return true; // Quiz complete
    }
  };

  // Get current quiz state
  const quizState: QuizState = {
    currentQuestion,
    answers: quizAnswers,
    shuffledQuestions,
    showWelcome,
    clickPattern,
    archetypeDistribution
  };

  return {
    // State
    ...quizState,
    
    // Computed values
    isQuizComplete: currentQuestion >= shuffledQuestions.length,
    totalQuestions: shuffledQuestions.length,
    currentQuestionData: shuffledQuestions[currentQuestion],
    
    // Actions
    startQuiz,
    resetQuiz,
    hardReset, // Added this for complete reset
    handleQuizAnswer,
    setShowWelcome,
    setCurrentQuestion,
  };
}