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
      {/* Mobile-First Poster Section - Matches Figma */}
      <section className="relative w-full">
        {/* Mobile Layout - Full poster with letterboxing */}
        <div className="block md:hidden">
          <div className="relative w-full h-[50vh] min-h-[400px] max-h-[600px]">
            <Image
              src="/assets/mobile-poster.png"
              alt="Back Against the Wall Poster"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </div>
        </div>

        {/* Desktop Layout - Full Screen */}
        <div className="hidden md:block">
          <div className="relative w-full h-screen">
            <Image
              src="/assets/desktop-poster.png"
              alt="Back Against the Wall Poster"
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </div>
        </div>
      </section>

      {/* Mobile-Optimized Content Section - Matches Figma Layout */}
      <section className="bg-white text-black">
        {/* Mobile Content */}
        <div className="block md:hidden px-6 py-8">
          <div className="text-center space-y-6">
            {/* Main Headline - Matches Figma Typography */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                When financial pressure mounts,
              </h1>
              <h2 className="text-2xl font-bold text-[#B95D38] leading-tight">
                who do you become?
              </h2>
            </div>

            {/* Description Text - Matches Figma */}
            <p className="text-sm text-gray-700 leading-relaxed max-w-sm mx-auto">
              Before watching Samara's story, take this short quiz to uncover your financial personality.
              Are you the kind of person who freezes, risks it all, plays it smart, or plays the long game?
              Based on your results, you may or may not find yourself in the film.
            </p>

            {/* CTA Button - Matches Figma Style */}
            <div className="pt-4">
              {user ? (
                latestResult?.hasWatchedFilm ? (
                  // Journey Complete State
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">Journey Complete!</h3>
                      <p className="text-sm text-gray-600">
                        You're <span className="text-[#B95D38] font-medium">The {latestResult.archetype}</span>
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Button
                        onClick={onWatchFilm}
                        className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white w-full py-3 rounded-full font-medium"
                      >
                        Watch Again
                      </Button>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => onStartQuiz()}
                          variant="outline"
                          className="border-[#B95D38] text-[#B95D38] hover:bg-[#B95D38]/10 flex-1 py-3 rounded-full text-sm"
                        >
                          Retake Quiz
                        </Button>
                        <Button
                          onClick={onShowResults}
                          variant="outline"
                          className="border-[#B95D38] text-[#B95D38] hover:bg-[#B95D38]/10 flex-1 py-3 rounded-full text-sm"
                        >
                          View Results
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : latestResult ? (
                  // Has Results State
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Welcome back, <span className="text-[#B95D38]">The {latestResult.archetype}</span>!
                      </h3>
                      <p className="text-sm text-gray-600">
                        {latestResult.hasViewedResults
                          ? "Ready to watch the film?"
                          : "View your results first?"}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Button
                        onClick={latestResult.hasViewedResults ? onWatchFilm : onShowResults}
                        className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white w-full py-3 rounded-full font-medium"
                      >
                        {latestResult.hasViewedResults ? "Watch the Film" : "View Results & Watch"}
                      </Button>
                      <Button
                        onClick={() => onStartQuiz()}
                        variant="outline"
                        className="border-[#B95D38] text-[#B95D38] hover:bg-[#B95D38]/10 w-full py-3 rounded-full"
                      >
                        Retake Quiz
                      </Button>
                    </div>
                  </div>
                ) : (
                  // New User State
                  <div className="space-y-4">
                    <Button
                      onClick={onStartQuiz}
                      className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white w-full py-3 rounded-full font-medium text-base"
                    >
                      Take the quiz & Watch the film
                    </Button>
                    <button
                      onClick={onWatchFilm}
                      className="text-sm text-[#B95D38] hover:underline block w-full"
                    >
                      Watch the film without taking the quiz →
                    </button>
                  </div>
                )
              ) : (
                // Not Logged In State
                <div className="space-y-4">
                  <Button
                    onClick={onSignUp}
                    className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white w-full py-3 rounded-full font-medium text-base"
                  >
                    Sign Up to Begin
                  </Button>
                  <button
                    onClick={onWatchFilm}
                    className="text-sm text-[#B95D38] hover:underline block w-full"
                  >
                    Watch the film without taking the quiz →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Content - Original Design */}
        <div className="hidden md:block py-20 px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
              When financial pressure mounts,{" "}
              <span className="text-[#B95D38]">who do you become?</span>
            </h2>

            <p className="text-base lg:text-lg text-gray-700 leading-relaxed">
              Before watching Samara's story, take this short quiz to uncover your financial personality.
              Are you the kind of person who freezes, risks it all, plays it smart, or plays the long game?
              Based on your results, you may or may not find yourself in the film.
            </p>

            {user ? (
              latestResult?.hasWatchedFilm ? (
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
        </div>
      </section>

      {/* Support Section - Prominent AAPI Logo */}
      <section className="py-8 md:py-20 bg-gray-50 border-t">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center space-y-6 md:space-y-12">
            {/* Heading Text */}
            <div className="space-y-2 md:space-y-4">
              <p className="text-sm md:text-2xl font-semibold text-gray-700 tracking-wide uppercase leading-relaxed">
                Proudly supported by our partners
              </p>
              <p className="text-base md:text-3xl font-bold text-gray-800 tracking-wide uppercase leading-relaxed">
                and a grant from the AAPI Foundation
              </p>
            </div>
            
            {/* Large Centered AAPI Logo */}
            <div className="flex justify-center items-center py-4 md:py-8">
              <div className="relative w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64">
                <Image
                  src="/assets/aapi-logo.png"
                  alt="AAPI Foundation"
                  fill
                  className="object-contain hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 128px, (max-width: 1024px) 192px, 256px"
                  priority
                />
              </div>
            </div>

            {/* Additional partner acknowledgment */}
            <div className="pt-4 md:pt-8 max-w-2xl mx-auto">
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Special thanks to all community partners and individual supporters who made this project possible.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}