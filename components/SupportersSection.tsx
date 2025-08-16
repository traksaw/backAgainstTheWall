"use client"

import Image from "next/image"
import { FadeIn, FadeInUp, FadeInScale } from "@/components/ui/fade-in"
import { Supporter } from "@/types/supporter"

type SupportersSectionProps = {
  supporters: Supporter[]
}

export default function SupportersSection({ supporters }: SupportersSectionProps) {
  // Separate featured and regular supporters
  const featuredSupporters = supporters.filter(s => s.featured)
  const regularSupporters = supporters.filter(s => !s.featured)

  return (
    <section className="py-8 md:py-20 bg-gray-50 border-t">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center space-y-6 md:space-y-12">
          {/* Heading Text */}
          <FadeInUp delay={300} duration={800}>
            <div className="space-y-2 md:space-y-4">
              <p className="text-sm md:text-2xl font-semibold text-gray-700 tracking-wide uppercase leading-relaxed">
                Proudly supported by our partners
              </p>
              {featuredSupporters.some(s => s.type === 'foundation') && (
                <p className="text-base md:text-3xl font-bold text-gray-800 tracking-wide uppercase leading-relaxed">
                  and a grant from the AAPI Foundation
                </p>
              )}
            </div>
          </FadeInUp>
          
          {/* Featured Supporters (Large Display) */}
          {featuredSupporters.length > 0 && (
            <FadeInScale delay={600} duration={800}>
              <div className="flex justify-center items-center py-4 md:py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl">
                  {featuredSupporters.map((supporter, index) => (
                    <div key={supporter.name} className="flex justify-center">
                      <div className="relative w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64">
                        {supporter.website ? (
                          <a 
                            href={supporter.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block w-full h-full"
                          >
                            <Image
                              src={supporter.logo}
                              alt={supporter.name}
                              fill
                              className="object-contain hover:scale-110 transition-transform duration-500"
                              sizes="(max-width: 768px) 128px, (max-width: 1024px) 192px, 256px"
                            />
                          </a>
                        ) : (
                          <Image
                            src={supporter.logo}
                            alt={supporter.name}
                            fill
                            className="object-contain hover:scale-110 transition-transform duration-500"
                            sizes="(max-width: 768px) 128px, (max-width: 1024px) 192px, 256px"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeInScale>
          )}

          {/* Regular Supporters Grid */}
          {regularSupporters.length > 0 && (
            <FadeInUp delay={900} duration={800}>
              <div className="pt-8 md:pt-12">
                <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-6 md:mb-8">
                  Community Partners
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
                  {regularSupporters.map((supporter, index) => (
                    <div key={supporter.name} className="flex flex-col items-center space-y-2">
                      <div className="relative w-20 h-20 md:w-24 md:h-24">
                        {supporter.website ? (
                          <a 
                            href={supporter.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block w-full h-full"
                          >
                            <Image
                              src={supporter.logo}
                              alt={supporter.name}
                              fill
                              className="object-contain hover:scale-110 transition-transform duration-300"
                              sizes="(max-width: 768px) 80px, 96px"
                            />
                          </a>
                        ) : (
                          <Image
                            src={supporter.logo}
                            alt={supporter.name}
                            fill
                            className="object-contain hover:scale-110 transition-transform duration-300"
                            sizes="(max-width: 768px) 80px, 96px"
                          />
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 text-center font-medium">
                        {supporter.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeInUp>
          )}

          {/* Fallback if no supporters */}
          {supporters.length === 0 && (
            <FadeInScale delay={600} duration={800}>
              <div className="flex justify-center items-center py-4 md:py-8">
                <div className="relative w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64">
                  {/* <Image
                    src="/assets/aapi-logo.png"
                    alt="AAPI Foundation"
                    fill
                    className="object-contain hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 128px, (max-width: 1024px) 192px, 256px"
                    priority
                  /> */}
                </div>
              </div>
            </FadeInScale>
          )}

          {/* Additional acknowledgment */}
          <FadeInUp delay={1200} duration={800}>
            <div className="pt-4 md:pt-8 max-w-2xl mx-auto">
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Special thanks to all community partners and individual supporters who made this project possible.
              </p>
            </div>
          </FadeInUp>
        </div>
      </div>
    </section>
  )
}
