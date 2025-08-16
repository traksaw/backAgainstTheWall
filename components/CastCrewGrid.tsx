import { useState, useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { FadeIn, FadeInUp } from "@/components/ui/fade-in";
import { cn } from "@/lib/utils";

interface CastMember {
  name: string
  role: string
  description: string
  image: string
  readMoreUrl?: string
  order?: number
  imageAlt?: string
}

interface CastCrewGridProps {
  castMembers: CastMember[];
}

// Enhanced loading skeleton
const LoadingSkeleton = ({ type, index }: { type: 'cast' | 'crew', index: number }) => (
  <div 
    className={cn(
      "text-center space-y-3 animate-pulse",
      type === 'cast' ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    )}
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
    <div className="space-y-2">
      <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
      <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
    </div>
  </div>
);

export default function CastCrewGrid({ castMembers }: CastCrewGridProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  const sectionRef = useRef<HTMLDivElement>(null);

  // Filter cast and crew
  const cast = castMembers.filter(person =>
    person.role.toLowerCase().includes('samara') ||
    person.role.toLowerCase().includes('boyfriend') ||
    person.role.toLowerCase().includes('mom')
  );

  const crew = castMembers.filter(person =>
    !person.role.toLowerCase().includes('samara') &&
    !person.role.toLowerCase().includes('boyfriend') &&
    !person.role.toLowerCase().includes('mom')
  );

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // No images rendered in this mode

  // Loading state
  if (!castMembers || castMembers.length === 0) {
    return (
      <section ref={sectionRef} className="hidden md:block py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Meet the Cast & Crew</h2>
            <p className="text-lg text-gray-600" aria-live="polite">
              Cast and crew profiles are coming soon. Thanks for your patience!
            </p>
          </div>

          {/* Cast Placeholder */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-semibold text-gray-900">Cast</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="text-center space-y-3">
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-48 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded w-36 mx-auto"></div>
                    <div className="h-3 bg-gray-200 rounded w-64 mx-auto"></div>
                    <div className="h-3 bg-gray-200 rounded w-40 mx-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Crew Placeholder */}
          <div>
            <div className="text-center mb-10">
              <h3 className="text-2xl font-semibold text-gray-900">Production Team</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-40 mx-auto"></div>
                    <div className="h-3 bg-gray-200 rounded w-28 mx-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="hidden md:block py-24 bg-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#B95D38] rounded-full animate-float blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-[#669CCB] rounded-full animate-float-delayed blur-2xl"></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-[#B95D38]/30 rounded-full animate-bounce-slow"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Enhanced header */}
        <FadeInUp delay={200} duration={800}>
          <div className="text-center mb-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#B95D38]/5 to-transparent blur-xl"></div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 relative transform transition-all duration-500 hover:scale-105">
              Meet the Cast & Crew
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed relative transform transition-all duration-300 hover:text-gray-800">
              Thank you to all whose hands were involved in this exploration of young Asian-American financial psychology.
            </p>
          </div>
        </FadeInUp>

        {/* Enhanced Cast Section */}
        {cast.length > 0 && (
          <div className="mb-16">
            <FadeInUp delay={400} duration={800}>
              <div className="text-center mb-12 relative">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <h3 className="text-3xl font-bold text-gray-900 transform transition-all duration-300 hover:text-[#B95D38]">
                    Cast
                  </h3>
                </div>
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#B95D38] to-transparent mx-auto"></div>
              </div>
            </FadeInUp>
          
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {cast
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((person, index) => (
                  <div
                    key={`cast-${index}`}
                    className={cn(
                      "transform transition-all duration-700",
                      isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                    )}
                    style={{ transitionDelay: `${600 + index * 150}ms` }}
                  >
                    <div className="group text-center space-y-3 transform transition-all duration-500 hover:scale-105 relative p-6 rounded-2xl hover:bg-gradient-to-br hover:from-white hover:to-[#B95D38]/5 hover:shadow-2xl hover:shadow-[#B95D38]/10">
                      
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#B95D38]/10 to-[#669CCB]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl"></div>
                      
                      {/* Content */}
                      <div className="relative z-10">
                        {/* Images removed */}

                        {/* Enhanced typography */}
                        <div className="space-y-2">
                          <h4 className="text-2xl font-bold text-gray-900 group-hover:text-[#B95D38] transition-all duration-300 transform group-hover:scale-105">
                            {person.name}
                          </h4>
                          <p className="text-[#B95D38] font-semibold text-base uppercase tracking-wider group-hover:tracking-widest transition-all duration-300">
                            {person.role}
                          </p>
                        </div>

                        {/* Enhanced description */}
                        <div className="pt-2">
                          <p className="text-gray-600 text-sm leading-relaxed italic max-w-sm mx-auto group-hover:text-gray-800 transition-colors duration-300">
                            {person.description}
                          </p>
                          {person.readMoreUrl && (
                            <a
                              href={person.readMoreUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#B95D38] text-sm hover:underline inline-flex items-center gap-1 mt-2 font-medium transition-all duration-300 hover:text-[#B95D38]/80 transform hover:scale-105 group-hover:gap-2"
                            >
                              Read more 
                              <ExternalLink className="w-3 h-3 transform transition-transform duration-300 group-hover:rotate-12" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Enhanced Crew Section */}
        {crew.length > 0 && (
          <div>
            <FadeInUp delay={400} duration={800}>
              <div className="text-center mb-12 relative">
                <div className="mb-4">
                  <h3 className="text-3xl font-bold text-gray-900 transform transition-all duration-300 hover:text-[#669CCB]">
                    Production Team
                  </h3>
                </div>
                <div className="w-32 h-1 bg-gradient-to-r from-transparent via-[#669CCB] to-transparent mx-auto"></div>
              </div>
            </FadeInUp>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {crew
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((person, index) => (
                  <div
                    key={`crew-${index}`}
                    className={cn(
                      "transform transition-all duration-600",
                      isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                    )}
                    style={{ transitionDelay: `${800 + index * 100}ms` }}
                  >
                    <div className="group text-center space-y-2 transform transition-all duration-500 hover:scale-105 relative p-4 rounded-xl hover:bg-gradient-to-br hover:from-white hover:to-[#669CCB]/5 hover:shadow-xl hover:shadow-[#669CCB]/10">
                      
                      {/* Content */}
                      <div className="relative z-10">
                        {/* Images removed */}

                        {/* Enhanced typography */}
                        <div className="space-y-1">
                          <h4 className="text-lg font-bold text-gray-900 group-hover:text-[#669CCB] transition-all duration-300 transform group-hover:scale-105">
                            {person.name}
                          </h4>
                          <p className="text-[#669CCB] font-semibold text-sm uppercase tracking-wide group-hover:tracking-widest transition-all duration-300">
                            {person.role}
                          </p>
                        </div>

                        {/* Enhanced description */}
                        <div className="pt-1">
                          <p className="text-gray-600 text-xs leading-relaxed italic group-hover:text-gray-800 transition-colors duration-300">
                            {person.description}
                          </p>
                          {person.readMoreUrl && (
                            <a
                              href={person.readMoreUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#669CCB] text-xs hover:underline inline-flex items-center gap-1 mt-1 font-medium transition-all duration-300 hover:text-[#669CCB]/80 transform hover:scale-105 group-hover:gap-2"
                            >
                              Portfolio 
                              <ExternalLink className="w-2 h-2 transform transition-transform duration-300 group-hover:rotate-12" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>  

      {/* Custom CSS for advanced animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(3deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(-2deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite 3s;
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite 1s;
        }
      `}</style>
    </section>  
  );
}