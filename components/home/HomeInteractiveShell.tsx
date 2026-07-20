"use client"

import type { ReactNode } from "react"
import { QuizModal } from "@/components/quiz/QuizModal"
import { ResultsModal } from "@/components/results/ResultsModal"
import { UserMenu } from "@/components/layout/UserMenu"
import { SignInModal } from "@/components/auth/SignInModal"
import { SignUpModal } from "@/components/auth/SignUpModal"
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal"
import { VerificationBanner } from "@/components/auth/VerificationBanner"
import Hero from "@/components/Hero"
import { VideoPlayer } from "@/components/VideoPlayer"
import { QuizHistorySection } from "@/components/QuizHistorySection"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useHomeController } from "@/components/home/useHomeController"
import { useAuth } from "@/hooks/useAuth"
import { getVideoSrc } from "@/lib/video"
import type { Supporter } from "@/types/supporter"
import type { User, Profile } from "@/types/auth"

const VIDEO_SRC = getVideoSrc(process.env.NEXT_PUBLIC_VIDEO_URL)

interface HomeInteractiveShellProps {
  supporters: Supporter[]
  children: ReactNode
}

export function HomeInteractiveShell({ supporters, children }: HomeInteractiveShellProps) {
  const { user: rawUser, profile: rawProfile, signOut, resendVerification } = useAuth()
  const controller = useHomeController()

  const user: User | null = rawUser ? {
    _id: rawUser._id,
    email: rawUser.email,
    first_name: rawUser.first_name || '',
    last_name: rawUser.last_name || '',
    emailVerified: rawUser.emailVerified ?? false
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

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {user && !user.emailVerified && (
        <VerificationBanner email={user.email} onResend={resendVerification} />
      )}

      <UserMenu
        user={user}
        profile={profile}
        onSignOut={signOut}
        onShowQuizHistory={controller.openQuizHistory}
      />

      <Hero
        user={user}
        latestResult={controller.latestResult}
        supporters={supporters}
        onSignUp={controller.openSignup}
        onStartQuiz={controller.startQuiz}
        onRetakeQuiz={controller.retakeQuiz}
        onShowResults={controller.openResults}
        onWatchFilm={controller.openFilm}
      />

      {children}

      <SignUpModal
        open={controller.activeModal === 'signup'}
        onOpenChange={(open) => !open && controller.closeActiveModal()}
        onSwitchToSignIn={controller.switchToSignIn}
        onSuccess={controller.signupSucceeded}
      />

      <SignInModal
        open={controller.activeModal === 'signin'}
        onOpenChange={(open) => !open && controller.closeActiveModal()}
        onSwitchToSignUp={controller.switchToSignUp}
        onSwitchToForgotPassword={controller.switchToForgotPassword}
      />

      <ForgotPasswordModal
        open={controller.activeModal === 'forgotPassword'}
        onOpenChange={(open) => !open && controller.closeActiveModal()}
        onSwitchToSignIn={controller.switchToSignIn}
      />

      <QuizModal
        key={controller.quizSession}
        open={controller.activeModal === 'quiz'}
        onOpenChange={(open) => !open && controller.closeActiveModal()}
        onQuizComplete={controller.completeQuiz}
        profile={userProfile}
        autoReset={controller.autoResetQuiz}
        quizLoading={controller.quizLoading}
      />

      <ResultsModal
        open={controller.activeModal === 'results'}
        onOpenChange={(open) => !open && controller.closeActiveModal()}
        latestResult={controller.latestResult}
        onResultsViewed={controller.viewResults}
        loading={controller.quizLoading}
        onRetakeQuiz={controller.retakeQuiz}
      />

      <Dialog open={controller.activeModal === 'film'} onOpenChange={(open) => !open && controller.closeActiveModal()}>
        <DialogContent className="w-[95vw] max-w-5xl bg-black border-0 max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-white">
              Back Against the Wall
            </DialogTitle>
            <DialogDescription className="text-center text-gray-300 text-sm sm:text-base px-2">
              {user && controller.latestResult?.archetype ? (
                <>
                  Watching as <span className="text-[#B95D38]">The {controller.latestResult.archetype}</span> — Notice how the
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
              src={VIDEO_SRC}
              poster="/assets/desktop-movie-poster.png"
              title="Back Against the Wall"
              onEnded={controller.completeFilm}
              onError={controller.handleVideoError}
              className="aspect-video w-full"
              autoPlay={false}
            />
            {controller.latestResult?.archetype && (
              <div className="absolute top-4 right-4 z-30">
                <div className="bg-[#B95D38]/90 text-white px-3 py-1 rounded-full text-sm font-medium">
                  The {controller.latestResult.archetype}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <QuizHistorySection
        open={controller.activeModal === 'quizHistory'}
        onOpenChange={(open) => !open && controller.closeActiveModal()}
      />
    </div>
  )
}
