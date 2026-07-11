// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HomeInteractiveShell } from './HomeInteractiveShell'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, profile: null, signOut: vi.fn(), loading: true }),
}))

vi.mock('@/components/home/useHomeController', () => ({
  useHomeController: () => ({
    showSignup: false,
    showSignin: false,
    showQuiz: false,
    showResults: false,
    showFilm: false,
    showQuizHistory: false,
    setShowSignup: vi.fn(),
    setShowSignin: vi.fn(),
    setShowQuiz: vi.fn(),
    setShowResults: vi.fn(),
    setShowFilm: vi.fn(),
    setShowQuizHistory: vi.fn(),
    quizSession: 0,
    autoResetQuiz: false,
    latestResult: null,
    quizLoading: false,
    openSignup: vi.fn(),
    openSignin: vi.fn(),
    openResults: vi.fn(),
    openFilm: vi.fn(),
    openQuizHistory: vi.fn(),
    closeAllModals: vi.fn(),
    switchToSignIn: vi.fn(),
    switchToSignUp: vi.fn(),
    signupSucceeded: vi.fn(),
    startQuiz: vi.fn(),
    retakeQuiz: vi.fn(),
    completeQuiz: vi.fn(),
    viewResults: vi.fn(),
    completeFilm: vi.fn(),
    handleVideoError: vi.fn(),
  }),
}))

vi.mock('@/components/Hero', () => ({
  default: () => <div data-testid="hero">Hero content</div>,
}))
vi.mock('@/components/VideoPlayer', () => ({ VideoPlayer: () => null }))
vi.mock('@/components/QuizHistorySection', () => ({ QuizHistorySection: () => null }))
vi.mock('@/components/quiz/QuizModal', () => ({ QuizModal: () => null }))
vi.mock('@/components/results/ResultsModal', () => ({ ResultsModal: () => null }))
vi.mock('@/components/layout/UserMenu', () => ({ UserMenu: () => <div data-testid="user-menu" /> }))
vi.mock('@/components/auth/SignInModal', () => ({ SignInModal: () => null }))
vi.mock('@/components/auth/SignUpModal', () => ({ SignUpModal: () => null }))

describe('HomeInteractiveShell', () => {
  it('renders the already-server-rendered content instead of a loading gate while auth resolves', () => {
    render(<HomeInteractiveShell supporters={[]}>{null}</HomeInteractiveShell>)

    // Regression guard for cd99d5a: HomeInteractiveShell used to return a
    // full-page LoadingScreen whenever authLoading was true, hiding Hero/UserMenu.
    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(screen.getByTestId('user-menu')).toBeInTheDocument()
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  })
})
