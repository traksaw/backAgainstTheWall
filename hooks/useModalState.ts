// hooks/useModalState.ts
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
    setShowSignup(false);
    setShowSignin(false);
    setShowQuiz(false);
    setShowResults(false);
    setShowFilm(false);
    setShowQuizHistory(false);
  };

  // Modal navigation helpers
  const openSignup = () => {
    closeAllModals();
    setShowSignup(true);
  };

  const openSignin = () => {
    closeAllModals();
    setShowSignin(true);
  };

  const openQuiz = () => {
    closeAllModals();
    setShowQuiz(true);
  };

  const openResults = () => {
    closeAllModals();
    setShowResults(true);
  };

  const openFilm = () => {
    closeAllModals();
    setShowFilm(true);
  };

  const openQuizHistory = () => {
    closeAllModals();
    setShowQuizHistory(true);
  };

  // Switch between auth modals
  const switchToSignIn = () => {
    setShowSignup(false);
    setShowSignin(true);
  };

  const switchToSignUp = () => {
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
    setShowSignup,
    setShowSignin,
    setShowQuiz,
    setShowResults,
    setShowFilm,
    setShowQuizHistory,

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