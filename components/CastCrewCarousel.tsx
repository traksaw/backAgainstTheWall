import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, Sparkles } from "lucide-react";
import { FadeIn, FadeInUp } from "@/components/ui/fade-in";

interface CastMember {
  name: string;
  role: string;
  description: string;
  image: string;
  readMoreUrl?: string;
  order: number;
}

interface CastCrewCarouselProps {
  castMembers?: CastMember[];
}

// Loading skeleton component
const LoadingSkeleton = ({ index }: { index: number }) => (
  <div 
    className="flex-shrink-0 w-[75%] max-w-xs snap-start"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="bg-gray-50 rounded-xl shadow-sm p-4 text-center space-y-2 h-full animate-pulse">
      <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3 animate-pulse"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
      </div>
    </div>
  </div>
);

export default function CastCrewCarousel({ castMembers = [] }: CastCrewCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [loadedImages, setLoadedImages] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
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

  const allPeople = [...cast, ...crew];

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Handle scroll to update active dot
  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = scrollRef.current.clientWidth * 0.75;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(newIndex, allPeople.length - 1));
    }
  };

  // Scroll to specific card with smooth animation
  const scrollToCard = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: cardWidth * index,
        behavior: 'smooth'
      });
    }
  };

  // Handle image loading for progressive reveal
  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => prev.includes(index) ? prev : [...prev, index]);
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Show loading skeletons if no data yet
  if (!castMembers || castMembers.length === 0) {
    return (
      <section ref={sectionRef} className="relative py-12 bg-white md:hidden">
        <div className="px-6">
          <div className="text-xl font-bold text-gray-900 mb-4 text-center animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto mb-6 animate-pulse"></div>
        </div>

        <div className="relative px-6">
          <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
            <div className="flex gap-4">
              {[0, 1, 2].map((index) => (
                <LoadingSkeleton key={index} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative py-12 bg-white md:hidden overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#B95D38] rounded-full animate-float"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-[#669CCB] rounded-full animate-float-delayed"></div>
      </div>

      {/* Header with enhanced animations */}
      <div className="px-6 relative z-10">
        <FadeIn delay={200} duration={800}>
          <div className="relative">
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center transform transition-all duration-500 hover:scale-105">
              Meet the Cast & Crew
            </h2>
          </div>
        </FadeIn>
        <FadeIn delay={400} duration={600}>
          <p className="text-sm text-gray-600 text-center mb-6 transform transition-all duration-300 hover:text-gray-800">
            Thank you to all whose hands were involved in this exploration of young Asian-American financial psychology.
          </p>
        </FadeIn>
      </div>
      {/* Enhanced carousel with staggered animations */}
      <div className="relative px-6">
        {/* Enhanced gradient edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />
        <div 
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide -mx-6 px-6 scroll-smooth"
        >
          <div className="flex gap-4 snap-x snap-mandatory">
            {allPeople.map((person, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex-shrink-0 w-[75%] max-w-xs snap-start transform transition-all duration-700",
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                )}
                style={{ 
                  animationDelay: `${600 + idx * 150}ms`,
                  transitionDelay: `${idx * 100}ms`
                }}
              >
                <div className="group bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center space-y-2 h-full transform transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-[#B95D38]/10 hover:-translate-y-1 relative overflow-hidden">
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#B95D38]/5 to-[#669CCB]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Enhanced image with loading animation */}
                    {person.image && (
                      <div className="relative">
                        <img 
                          src={person.image} 
                          alt={person.name}
                          className={cn(
                            "w-16 h-16 rounded-full mx-auto mb-3 object-cover transition-all duration-500 ring-2 ring-transparent group-hover:ring-[#B95D38]/20 group-hover:scale-110",
                            loadedImages.includes(idx) ? "opacity-100 scale-100" : "opacity-0 scale-90"
                          )}
                          onLoad={() => handleImageLoad(idx)}
                        />
                        {/* Loading shimmer */}
                        {!loadedImages.includes(idx) && (
                          <div className="absolute inset-0 w-16 h-16 rounded-full mx-auto mb-3 bg-gray-200 animate-pulse"></div>
                        )}
                      </div>
                    )}

                    {/* Enhanced typography with animations */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-[#B95D38] transition-colors duration-300 transform group-hover:scale-105">
                        {person.name}
                      </h3>
                      <p className="text-[#B95D38] font-semibold text-xs uppercase tracking-wider line-clamp-2 group-hover:tracking-widest transition-all duration-300">
                        {person.role}
                      </p>
                    </div>

                    {/* Enhanced description */}
                    <div className="pt-1">
                      <p className="text-gray-600 text-xs leading-relaxed italic line-clamp-4 mb-2 group-hover:text-gray-800 transition-colors duration-300">
                        {person.description}
                      </p>
                      {person.readMoreUrl && (
                        <a
                          href={person.readMoreUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#B95D38] text-xs hover:underline inline-flex items-center gap-1 mt-1 font-medium transition-all duration-300 transform hover:scale-105 hover:text-[#B95D38]/80 group-hover:gap-2"
                        >
                          {cast.some(c => c.name === person.name) ? 'Read more' : 'Portfolio'}
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 transform transition-transform duration-300 group-hover:rotate-12" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced interactive dots */}
      {allPeople.length > 1 && (
        <FadeInUp delay={1000} duration={600}>
          <div className="flex justify-center mt-6 space-x-2">
            {allPeople.map((person, idx) => (
              <button
                key={idx}
                onClick={() => scrollToCard(idx)}
                className={cn(
                  "relative w-2 h-2 rounded-full transition-all duration-500 transform hover:scale-150 focus:outline-none focus:ring-2 focus:ring-[#B95D38]/50",
                  activeIndex === idx 
                    ? "bg-[#B95D38] scale-125 shadow-lg shadow-[#B95D38]/30" 
                    : "bg-gray-300 hover:bg-gray-400 hover:shadow-md"
                )}
                aria-label={`Scroll to ${person.name}`}
              >
                {/* Active indicator glow */}
                {activeIndex === idx && (
                  <div className="absolute inset-0 rounded-full bg-[#B95D38] animate-ping opacity-30"></div>
                )}
              </button>
            ))}
          </div>
        </FadeInUp>
      )}

      {/* Custom CSS for floating animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite 2s;
        }
      `}</style>
    </section>
  );
}