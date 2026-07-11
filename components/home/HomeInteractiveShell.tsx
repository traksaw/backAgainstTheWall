"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { QuizModal } from "@/components/quiz/QuizModal"
import { ResultsModal } from "@/components/results/ResultsModal"
import { UserMenu } from "@/components/layout/UserMenu"
import { SignInModal } from "@/components/auth/SignInModal"
import { SignUpModal } from "@/components/auth/SignUpModal"
import Hero from "@/components/Hero"
import { VideoPlayer } from "@/components/VideoPlayer"
import { QuizHistorySection } from "@/components/QuizHistorySection"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useModalState } from "@/hooks/useModalState"
import { useQuizHandlers } from "@/hooks/useQuizHandlers"
import { useAuth } from "@/hooks/useAuth"
import { useQuiz } from "@/hooks/useQuiz"
import type { QuizResult as TypesQuizResult, Archetype, QuizScores, QuizAnswer as TypesQuizAnswer } from '@/types/quiz'
import type { QuizResult, QuizAnswer } from '@/lib/quiz'
import type { Supporter } from "@/types/supporter"
import type { User, Profile } from "@/types/auth"

interface HomeInteractiveShellProps {
  supporters: Supporter[]
  children: ReactNode
}

export function HomeInteractiveShell({ supporters, children }: HomeInteractiveShellProps) {
  const { user: rawUser, profile: rawProfile, signOut } = useAuth()

  const user: User | null = rawUser ? {
    _id: rawUser._id,
    email: rawUser.email,
    first_name: rawUser.first_name || '',
    last_name: rawUser.last_name || ''
  } : null

  const profile: Profile | null = rawProfile ? {
    first_name: rawProfile.first_name || '',
    last_name: rawProfile.last_name || ''
  } : null

  const userProfile = {
    _id: rawUser?._id || '',
    email: rawUser?.email || '',
    first_name: rawProfile?.first_name || '',
    last_name: rawProfile?.last_name || ''
  }

  const { latestResult, refreshResults, loading: quizLoading } = useQuiz()
  const [localLatestResult, setLocalLatestResult] = useState<QuizResult | null>(null)
  const [quizSession, setQuizSession] = useState(0)
  const [autoResetQuiz, setAutoResetQuiz] = useState(false)

  const modals = useModalState()
  const quizHandlers = useQuizHandlers()

  const handleQuizComplete = async (finalAnswers: Record<number, TypesQuizAnswer>) => {
    try {
      const sessionId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const scores: QuizScores = { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 };
      const archetype: Archetype = 'Realist';

      modals.setShowQuiz(false);

      const formattedResult: QuizResult = {
        _id: sessionId,
        id: sessionId,
        archetype: archetype,
        score: 0,
        scores: scores,
        createdAt: new Date().toISOString(),
        hasViewedResults: false,
        hasWatchedFilm: false,
        answers: finalAnswers,
        sessionId: sessionId
      };

      setLocalLatestResult(formattedResult);

      setTimeout(() => {
        modals.setShowResults(true);
      }, 300);

      try {
        const convertedAnswers: Record<number, QuizAnswer> = {};
        Object.entries(finalAnswers).forEach(([key, answer]) => {
          convertedAnswers[Number(key)] = {
            id: answer.id || 0,
            archetype: answer.archetype,
            points: answer.points,
            text: answer.text,
            questionId: answer.questionId,
            question: answer.question
          };
        });

        await quizHandlers.handleQuizComplete(convertedAnswers);
        await refreshResults();
      } catch (error) {
        console.warn('Backend submission failed, but results are shown optimistically:', error)
      }

    } catch (error) {
      console.error('❌ Quiz completion error:', error);
      modals.setShowQuiz(false);
      alert(`Quiz failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const handleResultsViewed = async () => {
    try {
      if (localLatestResult) {
        setLocalLatestResult({
          ...localLatestResult,
          hasViewedResults: true
        });
      }

      const resultToUpdate = normalizeLatestResult(latestResult) || localLatestResult;
      if (resultToUpdate) {
        await quizHandlers.handleResultsViewed(resultToUpdate);
      }

      modals.setShowResults(false);
      modals.setShowFilm(true);
    } catch (error) {
      console.warn('Failed to update results, but proceeding to show film:', error);
      modals.setShowResults(false);
      modals.setShowFilm(true);
    }
  }

  const handleFilmComplete = async () => {
    await quizHandlers.handleFilmComplete(latestResult)
    modals.setShowFilm(false)
  }

  const handleStartQuiz = () => {
    setQuizSession((s) => s + 1)
    setTimeout(() => {
      modals.openQuiz()
    }, 50)
  }

  const handleRetakeQuiz = () => {
    modals.closeAllModals()
    setQuizSession((s) => s + 1)
    setTimeout(() => {
      setAutoResetQuiz(true)
      modals.openQuiz()
    }, 150)
  }

  function normalizeLatestResult(raw: QuizResult | null): TypesQuizResult | null {
    if (raw && (raw._id || raw.id)) {
      const scores: QuizScores = raw.scores ?? { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 };

      return {
        _id: raw._id || raw.id || '',
        id: String(raw._id ?? raw.id ?? ''),
        archetype: raw.archetype as Archetype,
        score: Number(raw.score ?? 0),
        scores,
        createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : undefined,
        hasViewedResults: raw.hasViewedResults ?? false,
        hasWatchedFilm: raw.hasWatchedFilm ?? false,
        answers: raw.answers as Record<number, TypesQuizAnswer> | undefined,
        sessionId: raw.sessionId
      }
    }

    if (localLatestResult) {
      return localLatestResult;
    }

    return null;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <UserMenu
        user={user}
        profile={profile}
        onSignOut={signOut}
        onShowQuizHistory={modals.openQuizHistory}
      />

      <Hero
        user={user}
        latestResult={latestResult}
        supporters={supporters}
        onSignUp={modals.openSignup}
        onStartQuiz={handleStartQuiz}
        onRetakeQuiz={handleRetakeQuiz}
        onShowResults={modals.openResults}
        onWatchFilm={modals.openFilm}
      />

      {children}

      <SignUpModal
        open={modals.showSignup}
        onOpenChange={modals.setShowSignup}
        onSwitchToSignIn={modals.switchToSignIn}
        onSuccess={() => {
          modals.setShowSignup(false)
          setTimeout(() => {
            handleStartQuiz()
          }, 100)
        }}
      />

      <SignInModal
        open={modals.showSignin}
        onOpenChange={modals.setShowSignin}
        onSwitchToSignUp={modals.switchToSignUp}
      />

      <QuizModal
        key={quizSession}
        open={modals.showQuiz}
        onOpenChange={(open) => {
          if (!open) {
            setQuizSession((s) => s + 1)
            setAutoResetQuiz(false)
          }
          modals.setShowQuiz(open)
        }}
        onQuizComplete={handleQuizComplete}
        profile={userProfile}
        autoReset={autoResetQuiz}
      />

      <ResultsModal
        open={modals.showResults}
        onOpenChange={(open) => {
          modals.setShowResults(open)
        }}
        latestResult={normalizeLatestResult(latestResult)}
        onResultsViewed={handleResultsViewed}
        loading={quizLoading}
        onRetakeQuiz={handleRetakeQuiz}
      />

      <Dialog open={modals.showFilm} onOpenChange={modals.setShowFilm}>
        <DialogContent className="w-[95vw] max-w-5xl bg-black border-0 max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-white">
              Back Against the Wall
            </DialogTitle>
            <DialogDescription className="text-center text-gray-300 text-sm sm:text-base px-2">
              {user && latestResult?.archetype ? (
                <>
                  Watching as <span className="text-[#B95D38]">The {latestResult.archetype}</span> — Notice how the
                  characters' financial decisions reflect your own mindset
                </>
              ) : (
                <>
                  Watching as <span className="text-[#B95D38]">A Guest</span> — Observe how different financial
                  personalities handle pressure
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full">
            <VideoPlayer
              src="https://tkoohwnrcxpmkerj.public.blob.vercel-storage.com/Ambitious_compatible.mp4"
              poster="/assets/desktop-movie-poster.png"
              title="Back Against the Wall"
              onEnded={handleFilmComplete}
              onError={quizHandlers.handleVideoError}
              className="aspect-video w-full"
              autoPlay={false}
            />
            {latestResult?.archetype && (
              <div className="absolute top-4 right-4 z-30">
                <div className="bg-[#B95D38]/90 text-white px-3 py-1 rounded-full text-sm font-medium">
                  The {latestResult.archetype}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <QuizHistorySection
        open={modals.showQuizHistory}
        onOpenChange={modals.setShowQuizHistory}
      />
    </div>
  )
}
