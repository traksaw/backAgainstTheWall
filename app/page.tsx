// app/page.tsx
"use client"

import { useState, useEffect } from "react"
import { getSupporters, getCastAndCrew } from "@/lib/sanity"
import { QuizModal } from "@/components/quiz/QuizModal"
import { ResultsModal } from "@/components/results/ResultsModal"
import { UserMenu } from "@/components/layout/UserMenu"
import { LoadingScreen } from "@/components/layout/LoadingScreen"
import { SignInModal } from "@/components/auth/SignInModal"
import { SignUpModal } from "@/components/auth/SignUpModal"
import Hero from "@/components/Hero"
import CastCrewCarousel from "@/components/CastCrewCarousel"
import CastCrewGrid from "@/components/CastCrewGrid"
import ContactForm from "@/components/ContactForm"
import SocialAndEvent from "@/components/SocialAndEvents"
import Footer from "@/components/Footer"
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

interface CastMember {
  name: string;
  role: string;
  description: string;
  image: string;
  readMoreUrl?: string;
  order: number;
}

// This component now uses the auth context properly
// Triggering redeploy after CORS update
function FilmWebsiteContent() {
  const { user: rawUser, profile: rawProfile, signOut, loading: authLoading } = useAuth()

  // Convert IUser to User and Profile
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

  // Convert to UserProfile for QuizModal
  const userProfile = {
    _id: rawUser?._id || '',
    email: rawUser?.email || '',
    first_name: rawProfile?.first_name || '',
    last_name: rawProfile?.last_name || ''
  }
  const { latestResult, refreshResults, loading: quizLoading } = useQuiz()
  const [localLatestResult, setLocalLatestResult] = useState<QuizResult | null>(null)
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [quizSession, setQuizSession] = useState(0)
  const [autoResetQuiz, setAutoResetQuiz] = useState(false)

  // Replace 15+ useState calls with clean hooks
  const modals = useModalState()
  const [castData, setCastData] = useState<{ castMembers: CastMember[]; loading: boolean; error: Error | null; hasData: boolean; retry: () => void; }>({ 
    castMembers: [],
    loading: true,
    error: null,
    hasData: false,
    retry: () => {}
  })

  useEffect(() => {
    const fetchCastData = async () => {
      try {
        const data = await getCastAndCrew()
        setCastData({
          castMembers: data,
          loading: false,
          error: null,
          hasData: data.length > 0,
          retry: fetchCastData
        })
      } catch (error) {
        setCastData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch cast data'),
          hasData: false,
          retry: fetchCastData
        }))
      }
    }

    fetchCastData()
  }, [])
  const quizHandlers = useQuizHandlers()

  // Fetch supporters data on component mount
  useEffect(() => {
    const fetchSupporters = async () => {
      try {
        const supportersData = await getSupporters()
        setSupporters(supportersData)
      } catch (error) {
        console.error('Error fetching supporters:', error)
        setSupporters([])
      }
    }

    fetchSupporters()
  }, [])

  // Handle quiz completion
  const handleQuizComplete = async (finalAnswers: Record<number, TypesQuizAnswer>) => {
    try {

      // Step 1: Create a session ID
      const sessionId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const scores: QuizScores = { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 };
      const archetype: Archetype = 'Realist';  // Default archetype, will be updated by backend

      // Step 2: Close quiz modal immediately
      modals.setShowQuiz(false);

      // Step 3: Create a properly formatted result object
      const formattedResult: QuizResult = {
        _id: sessionId,
        id: sessionId,
        archetype: archetype,
        score: 0,  // Will be updated by backend
        scores: scores,
        createdAt: new Date().toISOString(),
        hasViewedResults: false,
        hasWatchedFilm: false,
        answers: finalAnswers,
        sessionId: sessionId
      };


      // Step 4: Set the local result immediately
      setLocalLatestResult(formattedResult);

      // Step 5: Show results with the formatted data
      setTimeout(() => {
        modals.setShowResults(true);
      }, 300);

      // Step 6: Try backend submission in background
      try {
        // Convert TypesQuizAnswer to QuizAnswer for backend submission
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
      console.warn('Failed to update results, but proceeding to show film:', error);
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

  function normalizeLatestResult(raw: QuizResult | null): TypesQuizResult | null {
    // First, try the backend result
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
        latestResult={latestResult}
        supporters={supporters}
        onSignUp={modals.openSignup}
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

export default function Page() {
  return (
    <FilmWebsiteContent />
  )
}