// Update your hooks/useModalState.ts with debugging
import { useState } from 'react';
import { ModalState } from '../types/modal';

export function useModalState() {
  const [showSignup, setShowSignup] = useState(false);
  const [showSignin, setShowSignin] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showFilm, setShowFilm] = useState(false);
  const [showQuizHistory, setShowQuizHistory] = useState(false);

  // Close all modals
  const closeAllModals = () => {
    console.log("🔄 Closing all modals...")
    setShowSignup(false);
    setShowSignin(false);
    setShowQuiz(false);
    setShowResults(false);
    setShowFilm(false);
    setShowQuizHistory(false);
    console.log("✅ All modals closed")
  };

  // Modal navigation helpers
  const openSignup = () => {
    console.log("🎯 Opening signup modal...")
    closeAllModals();
    setShowSignup(true);
    console.log("✅ Signup modal opened")
  };

  const openSignin = () => {
    console.log("🎯 Opening signin modal...")
    closeAllModals();
    setShowSignin(true);
    console.log("✅ Signin modal opened")
  };

  const openQuiz = () => {
    console.log("🎯 Opening quiz modal...")
    console.log("Current state before:", { showSignup, showSignin, showQuiz, showResults, showFilm, showQuizHistory })
    closeAllModals();
    setShowQuiz(true);
    console.log("✅ Quiz modal opened")
    
    // Log the state after a brief delay to confirm it took effect
    setTimeout(() => {
      console.log("Quiz modal state after opening:", showQuiz)
    }, 50)
  };

  const openResults = () => {
    console.log("🎯 Opening results modal...")
    closeAllModals();
    setShowResults(true);
    console.log("✅ Results modal opened")
  };

  const openFilm = () => {
    console.log("🎯 Opening film modal...")
    closeAllModals();
    setShowFilm(true);
    console.log("✅ Film modal opened")
  };

  const openQuizHistory = () => {
    console.log("🎯 Opening quiz history modal...")
    closeAllModals();
    setShowQuizHistory(true);
    console.log("✅ Quiz history modal opened")
  };

  // Switch between auth modals
  const switchToSignIn = () => {
    console.log("🔄 Switching to signin...")
    setShowSignup(false);
    setShowSignin(true);
  };

  const switchToSignUp = () => {
    console.log("🔄 Switching to signup...")
    setShowSignin(false);
    setShowSignup(true);
  };

  // Modal state object
  const modalState: ModalState = {
    showSignup,
    showSignin,
    showQuiz,
    showResults,
    showFilm,
    showQuizHistory,
  };

  return {
    // Current state
    ...modalState,

    // Individual setters (for compatibility)
    setShowSignup: (open: boolean) => {
      console.log("Manual setShowSignup:", open)
      setShowSignup(open)
    },
    setShowSignin: (open: boolean) => {
      console.log("Manual setShowSignin:", open)
      setShowSignin(open)
    },
    setShowQuiz: (open: boolean) => {
      console.log("Manual setShowQuiz:", open)
      setShowQuiz(open)
    },
    setShowResults: (open: boolean) => {
      console.log("Manual setShowResults:", open)
      setShowResults(open)
    },
    setShowFilm: (open: boolean) => {
      console.log("Manual setShowFilm:", open)
      setShowFilm(open)
    },
    setShowQuizHistory: (open: boolean) => {
      console.log("Manual setShowQuizHistory:", open)
      setShowQuizHistory(open)
    },

    // Navigation helpers
    openSignup,
    openSignin,
    openQuiz,
    openResults,
    openFilm,
    openQuizHistory,
    closeAllModals,

    // Auth modal switchers
    switchToSignIn,
    switchToSignUp,
  };
}