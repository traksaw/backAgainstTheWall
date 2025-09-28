// hooks/useQuizState.ts - Enhanced with robust anti-pattern detection
import { useState, useEffect } from 'react';
import { QuizQuestion, QuizAnswer, QuizState, Archetype } from '@/types/quiz';
import { quizQuestions } from '@/lib/quiz/questions';
import { createAdvancedRandomizedQuestions, detectRepetitivePattern } from '@/lib/quiz/utils';

export function useQuizState() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, QuizAnswer>>({});
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  // Base questions source; defaults to static, but replaced by API data when available
  const [baseQuestions, setBaseQuestions] = useState<QuizQuestion[]>(quizQuestions);
  const [clickPattern, setClickPattern] = useState<number[]>([]);
  const [archetypeDistribution, setArchetypeDistribution] = useState({
    Avoider: 0,
    Gambler: 0,
    Realist: 0,
    Architect: 0
  });

  // Load fresh questions from API (no-store) so Sanity updates appear immediately
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/quiz/content', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.questions) && data.questions.length) {
          setBaseQuestions(data.questions as QuizQuestion[]);
        }
      } catch (e) {
        console.warn('⚠️ Falling back to static quiz questions due to fetch error', e);
        if (!cancelled) setBaseQuestions(quizQuestions);
      }
    })();
    return () => { cancelled = true };
  }, []);

  // Initialize shuffled questions whenever baseQuestions changes
  useEffect(() => {
    setShuffledQuestions(createAdvancedRandomizedQuestions(baseQuestions));
  }, [baseQuestions]);

  // Start quiz function
  const startQuiz = () => {
    setShowWelcome(false);
    setCurrentQuestion(0);
    setQuizAnswers({});
    
    // Generate fresh shuffle for new quiz session
    const freshQuestions = createAdvancedRandomizedQuestions(baseQuestions, clickPattern);
    setShuffledQuestions(freshQuestions);
  };

  // Navigate back one question and rollback state for the last answer
  const goBackOne = () => {
    if (currentQuestion <= 0) return;
    const lastIndex = currentQuestion - 1;

    // Rollback click pattern
    const newPattern = [...clickPattern];
    newPattern.pop();
    setClickPattern(newPattern);

    // Rollback archetype distribution if previous answer exists
    const prev = quizAnswers[lastIndex];
    if (prev && prev.archetype && (archetypeDistribution as any)[prev.archetype] !== undefined) {
      setArchetypeDistribution({
        ...archetypeDistribution,
        [prev.archetype as keyof typeof archetypeDistribution]: Math.max(0, (archetypeDistribution as any)[prev.archetype] - 1)
      });
    }

    // Remove last answer
    const newAnswers = { ...quizAnswers } as Record<number, QuizAnswer>;
    delete newAnswers[lastIndex];
    setQuizAnswers(newAnswers);

    // Move cursor back
    setCurrentQuestion(lastIndex);
  };

  // Reset quiz function - COMPLETELY reset everything
  const resetQuiz = () => {    
    // Reset all state to initial values
    setCurrentQuestion(0);
    setQuizAnswers({});
    setShowWelcome(true);
    setClickPattern([]);
    setArchetypeDistribution({ Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 });
    
    // Generate completely new shuffled questions with enhanced anti-pattern
    const newShuffledQuestions = createAdvancedRandomizedQuestions(baseQuestions);
    setShuffledQuestions(newShuffledQuestions);
  };

  // Hard reset function - for when you want to force a complete restart
  const hardReset = () => {
    // Reset everything immediately
    setCurrentQuestion(0);
    setQuizAnswers({});
    setShowWelcome(true);
    setClickPattern([]);
    setArchetypeDistribution({ Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 });
    
    // Force immediate re-shuffle with enhanced algorithm
    setTimeout(() => {
      const newShuffledQuestions = createAdvancedRandomizedQuestions(baseQuestions);
      setShuffledQuestions(newShuffledQuestions);
    }, 0);
  };

  // Enhanced quiz answer handling with advanced pattern detection
  const handleQuizAnswer = (answer: QuizAnswer): boolean => {
    // Track which position was clicked (0-3) for pattern analysis
    const optionIndex = shuffledQuestions[currentQuestion]?.options.findIndex(opt => 
      opt.id === answer.id || opt.text === answer.text
    ) || 0;
    
    const newClickPattern = [...clickPattern, optionIndex];
    setClickPattern(newClickPattern);

    // Track archetype distribution for balancing
    const newDistribution = { ...archetypeDistribution };
    newDistribution[answer.archetype as keyof typeof newDistribution]++;
    setArchetypeDistribution(newDistribution);

    // Enhanced pattern detection with multiple strategies
    const isPatternDetected = detectRepetitivePattern(newClickPattern);
    
    if (isPatternDetected && newClickPattern.length >= 3) {
      // Apply immediate countermeasures to remaining questions
      const remainingQuestionCount = shuffledQuestions.length - currentQuestion - 1;
      
      if (remainingQuestionCount > 0) {
        // Keep current and answered questions, reshuffle remaining ones
        const answeredQuestions = shuffledQuestions.slice(0, currentQuestion + 1);
        const remainingQuestions = shuffledQuestions.slice(currentQuestion + 1);
        
        // Enhanced anti-pattern reshuffling
        const antiPatternQuestions = createAdvancedRandomizedQuestions(remainingQuestions);
        
        const updatedQuestions = [...answeredQuestions, ...antiPatternQuestions];
        setShuffledQuestions(updatedQuestions);
      }
    }

    // Enhanced answer with question context
    const enhancedAnswer = {
      ...answer,
      question: shuffledQuestions[currentQuestion]?.text || shuffledQuestions[currentQuestion]?.question,
    };
    
    const newAnswers = { ...quizAnswers, [currentQuestion]: enhancedAnswer };
    setQuizAnswers(newAnswers);

    // Progress to next question or complete quiz
    if (currentQuestion < shuffledQuestions.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      return false; // Quiz not complete
    } else {
      return true; // Quiz complete
    }
  };

  // 🔧 Return ALL the properties that QuizModal expects
  return {
    // ✅ Core state properties that QuizModal destructures
    currentQuestion,
    answers: quizAnswers,
    shuffledQuestions,
    showWelcome,
    clickPattern,
    archetypeDistribution,
    
    // ✅ Computed properties
    isQuizComplete: currentQuestion >= shuffledQuestions.length,
    totalQuestions: shuffledQuestions.length,
    currentQuestionData: shuffledQuestions[currentQuestion],
    
    // ✅ Action functions that QuizModal uses
    startQuiz,
    resetQuiz,
    hardReset,
    handleQuizAnswer,
    goBackOne,
    setShowWelcome,
    setCurrentQuestion,
  };
}