// components/Hero.tsx
"use client"

import Link from "next/link"
import { ArrowRight, Award, Brain, CheckCircle, Play } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

type HeroProps = {
  user: any
  profile: any
  latestResult: any
  onSignUp: () => void
  onSignIn: () => void
  onStartQuiz: () => void
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
            Before watching Samara’s story, take this short quiz to uncover your financial personality.
            Are you the kind of person who freezes, risks it all, plays it smart, or plays the long game?
            Based on your results, you may or may not find yourself in the film.
          </p>

          {!user ? (
            // Not logged in: Show sign-up and sign-in CTA buttons
            <div className="flex flex-col gap-4 items-center">
              <Button
                onClick={onSignIn}
                className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-md"
              >
                Take the quiz & Watch the film
              </Button>
              <Button
                variant="outline"
                onClick={onWatchFilm}
                className="text-sm text-[#B95D38] hover:underline"
              >
                Watch the film without taking the quiz →
              </Button>
            </div>
          ) : latestResult?.hasWatchedFilm ? (
            // Flow complete: show nothing
            null
          ) : (
            // Authenticated: quiz path or skip option
            <div className="flex flex-col items-center gap-6">
              <Button
                onClick={onStartQuiz}
                className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white text-lg px-8 py-4 rounded-full transition-all duration-300 shadow-md"
              >
                Take the quiz & Watch the film
              </Button>

              <Button
                variant="outline"
                onClick={onWatchFilm}
                className="text-sm text-[#B95D38] hover:underline"
              >
                Watch the film without taking the quiz →
              </Button>
            </div>
          )}
        </div>
      </section>


    </div>
  )
}
