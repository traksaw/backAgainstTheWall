// app/page.tsx
"use client"

import { useState, useEffect } from "react"
import { getSupporters } from "@/lib/sanity"
import { Supporter } from "@/types/supporter"
import { QuizModal } from "@/components/quiz/QuizModal"
import { ResultsModal } from "@/components/results/ResultsModal"
import { UserMenu } from "@/components/layout/UserMenu"
import { LoadingScreen } from "@/components/layout/LoadingScreen"
import { SignUpModal } from "@/components/auth/SignUpModal"
import { SignInModal } from "@/components/auth/SignInModal"
import Hero from "@/components/Hero"
import CastCrewCarousel from "@/components/CastCrewCarousel"
import CastCrewGrid from "@/components/CastCrewGrid"
import ContactForm from "@/components/ContactForm"
import SocialAndEvent from "@/components/SocialAndEvents"
import Footer from "@/components/Footer"
import { VideoPlayer } from "@/components/VideoPlayer"
import { QuizHistorySection } from "@/components/QuizHistorySection"
import { ClientOnly } from "@/components/ClientOnly"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { QuizResult, Archetype, QuizScores, QuizAnswer } from '@/types/quiz'
import { useQuizLogic } from "@/hooks/useQuizLogic"
import { useModalState } from "@/hooks/useModalState"
import { useCastData } from "@/hooks/useCastData"
import { useQuizHandlers } from "@/hooks/useQuizHandlers"
import { useQuizState } from "@/hooks/useQuizState"
import { useAuth } from "@/hooks/useAuth"
import { useQuiz } from "@/hooks/useQuiz"

// This component now uses the auth context properly
// Triggering redeploy after CORS update
function FilmWebsiteContent() {
  const { user, profile, signOut, loading: authLoading, isHydrated } = useAuth()
  const { latestResult, refreshResults, loading: quizLoading } = useQuiz()
  const [localLatestResult, setLocalLatestResult] = useState<QuizResult | null>(null)
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [supportersLoading, setSupportersLoading] = useState(true)
  const [quizSession, setQuizSession] = useState(0)
  const [autoResetQuiz, setAutoResetQuiz] = useState(false)

  // Replace 15+ useState calls with clean hooks
  const modals = useModalState()
  const castData = useCastData()
  const quizHandlers = useQuizHandlers()
  const quizState = useQuizState()
  const quizLogic = useQuizLogic()

  // Fetch supporters data on component mount
  useEffect(() => {
    const fetchSupporters = async () => {
      try {
        setSupportersLoading(true)
        const supportersData = await getSupporters()
        setSupporters(supportersData)
      } catch (error) {
        console.error('Error fetching supporters:', error)
        setSupporters([])
      } finally {
        setSupportersLoading(false)
      }
    }

    fetchSupporters()
  }, [])

  // Handle quiz completion
  const handleQuizComplete = async (finalAnswers: Record<number, QuizAnswer>) => {
    try {

      // Step 1: Process quiz data locally first
      const quizData = quizLogic.processQuizCompletion(finalAnswers);

      // Step 2: Close quiz modal immediately
      modals.setShowQuiz(false);

      // Step 3: Create a properly formatted result object
      const formattedResult: QuizResult = {
        _id: quizData.sessionId,
        id: quizData.sessionId,
        archetype: quizData.archetype,
        score: quizData.score,
        scores: quizData.scores,
        createdAt: new Date().toISOString(),
        hasViewedResults: false,
        hasWatchedFilm: false,
        answers: finalAnswers,
        sessionId: quizData.sessionId
      };


      // Step 4: Set the local result immediately
      setLocalLatestResult(formattedResult);

      // Step 5: Show results with the formatted data
      setTimeout(() => {
        modals.setShowResults(true);
      }, 300);

      // Step 6: Try backend submission in background
      try {
        await quizHandlers.handleQuizComplete(finalAnswers);
        await refreshResults();
      } catch (error) {
        // Backend submission failed, but results are shown optimistically.
      }

    } catch (error) {
      console.error('❌ Quiz completion error:', error);
      modals.setShowQuiz(false);
      alert(`Quiz failed: ${(error as any)?.message}`);
    }
  }

  // Handle results viewed
  const handleResultsViewed = async () => {
    try {
      // Update local state immediately
      if (localLatestResult) {
        setLocalLatestResult({
          ...localLatestResult,
          hasViewedResults: true
        });
      }

      // Try to update backend
      const resultToUpdate = normalizeLatestResult(latestResult) || localLatestResult;
      if (resultToUpdate) {
        await quizHandlers.handleResultsViewed(resultToUpdate);
      }

      modals.setShowResults(false);
      modals.setShowFilm(true);
    } catch (error) {
      // Failed to update results, but proceed to show film anyway.
      modals.setShowResults(false);
      modals.setShowFilm(true);
    }
  }

  // Handle film completion
  const handleFilmComplete = async () => {
    await quizHandlers.handleFilmComplete(latestResult)
    modals.setShowFilm(false)
  }

  // Handle starting new quiz
  const handleStartQuiz = () => {
    // Bump session to force QuizModal remount and fresh internal state
    setQuizSession((s) => s + 1)
    // Open quiz after a tick
    setTimeout(() => {
      modals.openQuiz()
    }, 50)
  }

  const handleRetakeQuiz = () => {

    // Close any open modals first
    modals.closeAllModals()

    // Bump session to force QuizModal remount
    setQuizSession((s) => s + 1)

    // Small delay then open quiz
    setTimeout(() => {
      // Enable auto-reset so the quiz state is fresh but welcome screen remains
      setAutoResetQuiz(true)
      modals.openQuiz()
    }, 150)
  }

  if (authLoading) {
    return <LoadingScreen message="Loading..." />
  }

  // Convert whatever the backend returns into a UI-friendly QuizResult
  function normalizeLatestResult(raw: any): QuizResult | null {
    // First, try the backend result
    if (raw && (raw._id || raw.id)) {
      const scores: QuizScores = raw.scores ?? { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 };

      return {
        _id: raw._id || raw.id,
        id: String(raw._id ?? raw.id ?? ''),
        archetype: raw.archetype as Archetype,
        score: Number(raw.score ?? 0),
        scores,
        createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : undefined,
        hasViewedResults: raw.hasViewedResults ?? false,
        hasWatchedFilm: raw.hasWatchedFilm ?? false,
        answers: raw.answers,
        sessionId: raw.sessionId
      }
    }

    // Fallback to local result
    if (localLatestResult) {
      return localLatestResult;
    }

    return null;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Clean User Menu Component */}
      <UserMenu
        user={user}
        profile={profile}
        onSignOut={signOut}
        onShowQuizHistory={modals.openQuizHistory}
      />

      {/* Hero Section */}
      <Hero
        user={user}
        profile={profile}
        latestResult={latestResult}
        supporters={supporters}
        onSignUp={modals.openSignup}
        onSignIn={modals.openSignin}
        onStartQuiz={handleStartQuiz} // For first time
        onRetakeQuiz={handleRetakeQuiz} // For retaking - pass this function
        onShowResults={modals.openResults}
        onWatchFilm={modals.openFilm}
      />

      {/* Cast & Crew Section - Using our refactored data */}
      <section className="py-12 sm:py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="block md:hidden">
            <CastCrewCarousel castMembers={castData.castMembers} />
          </div>
          {castData.loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B95D38] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading cast and crew information...</p>
            </div>
          ) : castData.hasData ? (
            <CastCrewGrid castMembers={castData.castMembers} />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No cast and crew information available.</p>
              {castData.error && (
                <button
                  onClick={castData.retry}
                  className="text-[#B95D38] hover:underline mt-2"
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Contact & Social */}
      <section className="py-12 sm:py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
              <ContactForm />
              <SocialAndEvent />
            </div>
          </div>
          <Footer />
        </div>
      </section>

      {/* Auth Modals */}
      <SignUpModal
        open={modals.showSignup}
        onOpenChange={modals.setShowSignup}
        onSwitchToSignIn={modals.switchToSignIn}
        onSuccess={() => {
          modals.setShowSignup(false)

          // Add a small delay to ensure the signup modal closes first
          setTimeout(() => {
            handleStartQuiz()
          }, 100) // 100ms delay
        }}
      />

      <SignInModal
        open={modals.showSignin}
        onOpenChange={modals.setShowSignin}
        onSwitchToSignUp={modals.switchToSignUp}
      />

      {/* Clean Modal Components */}
      <QuizModal
        key={quizSession}
        open={modals.showQuiz}
        onOpenChange={(open) => {
          if (!open) {
            // When closing quiz, reset it
            // Ensure next open is fresh as well
            setQuizSession((s) => s + 1)
            // Disable auto-reset after closing
            setAutoResetQuiz(false)
          }
          modals.setShowQuiz(open)
        }}
        onQuizComplete={handleQuizComplete}
        profile={profile}
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
      {/* Film Modal */}
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
              src="https://tkoohwnrcxpmkerj.public.blob.vercel-storage.com/Ambitious_FINAL_1920x1080_compat.webm"
              poster="/assets/desktop-movie-poster.png"
              title="Back Against the Wall"
              onEnded={handleFilmComplete}
              onError={quizHandlers.handleVideoError}
              archetype={latestResult?.archetype}
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

export default function Page() {
  return (
    <ClientOnly>
      <FilmWebsiteContent />
    </ClientOnly>
  )
}