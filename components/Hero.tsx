"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

type HeroProps = {
  user: any
  profile: any
  latestResult: any
  onSignUp: () => void
  onSignIn: () => void
  onStartQuiz: () => void
  onRetakeQuiz?: () => void
  onShowResults: () => void
  onWatchFilm: () => void
}

export default function Hero({
  user,
  profile,
  latestResult,
  onSignUp,
  onSignIn,
  onStartQuiz,
  onShowResults,
  onWatchFilm,
}: HeroProps) {
  return (
    <div className="w-full">
      {/* Poster Section */}
      <section className="relative w-full h-screen flex items-center justify-center text-white">
        <Image
          src="/desktop-poster.png"
          alt="Back Against the Wall Poster"
          fill
          className=""
          priority
        />
      </section>

      {/* CTA Section */}
      <section className="bg-white text-black py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            When financial pressure mounts,{" "}
            <span className="text-[#B95D38]">who do you become?</span>
          </h2>
          <p className="text-base md:text-lg text-gray-700">
            Before watching Samara's story, take this short quiz to uncover your financial personality.
            Are you the kind of person who freezes, risks it all, plays it smart, or plays the long game?
            Based on your results, you may or may not find yourself in the film.
          </p>
          {user ? (
            latestResult?.hasWatchedFilm ? (
              // Flow complete: show completion message and option to retake
              <div className="flex flex-col items-center gap-6">
                <div className="text-center space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">Journey Complete!</h3>
                  <p className="text-gray-600">
                    You've discovered you're <span className="text-[#B95D38] font-medium">The {latestResult.archetype}</span> and watched the film.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => onStartQuiz()}
                    variant="outline"
                    className="border-[#B95D38] text-[#B95D38] hover:bg-[#B95D38]/10"
                  >
                    Retake Quiz
                  </Button>
                  <Button
                    onClick={onWatchFilm}
                    className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white"
                  >
                    Watch Again
                  </Button>
                  <Button
                    onClick={onShowResults}
                    variant="outline"
                    className="border-[#B95D38] text-[#B95D38] hover:bg-[#B95D38]/10"
                  >
                    View Results
                  </Button>
                </div>
              </div>
            ) : latestResult ? (
              // User has taken quiz but not watched film
              <div className="flex flex-col items-center gap-6">
                <div className="text-center space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Welcome back, <span className="text-[#B95D38]">The {latestResult.archetype}</span>!
                  </h3>
                  <p className="text-gray-600">
                    {latestResult.hasViewedResults
                      ? "Ready to watch the film through your archetype lens?"
                      : "Would you like to review your results first, or go straight to the film?"
                    }
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={latestResult.hasViewedResults ? onWatchFilm : onShowResults}
                    className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white"
                  >
                    {latestResult.hasViewedResults ? "Watch the Film" : "View Results & Watch"}
                  </Button>
                  <Button
                    onClick={() => onStartQuiz()}
                    variant="outline"
                    className="border-[#B95D38] text-[#B95D38] hover:bg-[#B95D38]/10"
                  >
                    Retake Quiz
                  </Button>
                  {latestResult.hasViewedResults && (
                    <Button
                      onClick={onShowResults}
                      variant="outline"
                      className="border-[#B95D38] text-[#B95D38] hover:bg-[#B95D38]/10"
                    >
                      Review Results
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              // User hasn't taken quiz yet - original flow
              <div className="flex flex-col items-center gap-6">
                <Button
                  onClick={onStartQuiz}
                  className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-md"
                >
                  Take the quiz & Watch the film
                </Button>

                <button
                  onClick={onWatchFilm}
                  className="text-sm text-[#B95D38] hover:underline"
                >
                  Watch the film without taking the quiz →
                </button>
              </div>
            )
          ) : (
            // Not logged in: Show sign-up and sign-in CTA buttons
            <div className="flex flex-col gap-4 items-center">
              <Button
                size="lg"
                onClick={onSignUp}
                className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-md"
              >
                Sign Up to Begin
              </Button>
              <button
                onClick={onWatchFilm}
                className="text-sm text-[#B95D38] hover:underline"
              >
                Watch the film without taking the quiz →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 bg-gray-50 border-t">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-8">
            <h2 className="text-xl font-medium text-gray-600 tracking-wide uppercase">
              This short film is proudly supported by our partners and a grant from the AAPI Foundation
            </h2>
            
            {/* Support Logos */}
            <div className="flex justify-center items-center space-x-8 max-w-4xl mx-auto">
              {[1, 2, 3, 4].map((_, index) => (
                <div
                  key={index}
                  className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-300"
                >
                  {/* Placeholder for sponsor logos */}
                  <div className="w-16 h-16 bg-gray-400 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}