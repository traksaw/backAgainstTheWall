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
  const [clickPattern, setClickPattern] = useState<number[]>([]);
  const [archetypeDistribution, setArchetypeDistribution] = useState({
    Avoider: 0,
    Gambler: 0,
    Realist: 0,
    Architect: 0
  });

  // Initialize shuffled questions on mount
  useEffect(() => {
    console.log('🎯 useQuizState: Initializing enhanced shuffled questions');
    setShuffledQuestions(createAdvancedRandomizedQuestions(quizQuestions));
  }, []);

  // Start quiz function
  const startQuiz = () => {
    console.log('🎯 useQuizState: Starting quiz with fresh shuffle');
    setShowWelcome(false);
    setCurrentQuestion(0);
    setQuizAnswers({});
    
    // Generate fresh shuffle for new quiz session
    const freshQuestions = createAdvancedRandomizedQuestions(quizQuestions, clickPattern);
    setShuffledQuestions(freshQuestions);
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
    
    // Generate completely new shuffled questions with enhanced anti-pattern
    const newShuffledQuestions = createAdvancedRandomizedQuestions(quizQuestions, []);
    console.log('🎯 useQuizState: Generated new enhanced questions:', newShuffledQuestions.length);
    setShuffledQuestions(newShuffledQuestions);
  };

  // Hard reset function - for when you want to force a complete restart
  const hardReset = () => {
    console.log('🎯 useQuizState: Hard reset with enhanced shuffling');
    
    // Reset everything immediately
    setCurrentQuestion(0);
    setQuizAnswers({});
    setShowWelcome(true);
    setClickPattern([]);
    setArchetypeDistribution({ Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 });
    
    // Force immediate re-shuffle with enhanced algorithm
    setTimeout(() => {
      const newShuffledQuestions = createAdvancedRandomizedQuestions(quizQuestions, []);
      console.log('🎯 useQuizState: Hard reset - enhanced questions generated:', newShuffledQuestions.length);
      setShuffledQuestions(newShuffledQuestions);
    }, 0);
  };

  // Enhanced quiz answer handling with advanced pattern detection
  const handleQuizAnswer = (answer: QuizAnswer): boolean => {
    console.log('🎯 useQuizState: Processing answer for question', currentQuestion, ':', answer.text);
    
    // Track which position was clicked (0-3) for pattern analysis
    const optionIndex = shuffledQuestions[currentQuestion]?.options.findIndex(opt => 
      opt.id === answer.id || opt.text === answer.text
    ) || 0;
    
    const newClickPattern = [...clickPattern, optionIndex];
    setClickPattern(newClickPattern);
    
    console.log('🎯 Click pattern updated:', newClickPattern);

    // Track archetype distribution for balancing
    const newDistribution = { ...archetypeDistribution };
    newDistribution[answer.archetype as keyof typeof newDistribution]++;
    setArchetypeDistribution(newDistribution);

    // Enhanced pattern detection with multiple strategies
    const isPatternDetected = detectRepetitivePattern(newClickPattern, newDistribution);
    
    if (isPatternDetected && newClickPattern.length >= 3) {
      console.log('🎯 ENHANCED: Pattern gaming detected, applying countermeasures');
      
      // Apply immediate countermeasures to remaining questions
      const remainingQuestionCount = shuffledQuestions.length - currentQuestion - 1;
      
      if (remainingQuestionCount > 0) {
        console.log('🎯 ENHANCED: Reshuffling', remainingQuestionCount, 'remaining questions');
        
        // Keep current and answered questions, reshuffle remaining ones
        const answeredQuestions = shuffledQuestions.slice(0, currentQuestion + 1);
        const remainingQuestions = quizQuestions.filter((_, index) => 
          index > currentQuestion && index < quizQuestions.length
        );
        
        // Apply enhanced shuffling with current pattern data
        const antiPatternQuestions = createAdvancedRandomizedQuestions(
          remainingQuestions, 
          newClickPattern
        );
        
        // Merge answered + anti-pattern questions
        const updatedQuestions = [...answeredQuestions, ...antiPatternQuestions];
        setShuffledQuestions(updatedQuestions);
        
        console.log('🎯 ENHANCED: Anti-pattern reshuffling complete');
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
      console.log('🎯 useQuizState: Advancing to question', nextQuestion);
      setCurrentQuestion(nextQuestion);
      return false; // Quiz not complete
    } else {
      console.log('🎯 useQuizState: Quiz completed with enhanced anti-pattern protection!');
      
      // Final pattern analysis for debugging
      console.log('🎯 Final analysis:', {
        totalQuestions: shuffledQuestions.length,
        clickPattern: newClickPattern,
        archetypeDistribution: newDistribution,
        patternDetected: isPatternDetected
      });
      
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
    setShowWelcome,
    setCurrentQuestion,
  };
}