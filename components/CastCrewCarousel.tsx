import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { FadeIn, FadeInUp } from "@/components/ui/fade-in";

interface CastMember {
  name: string
  role: string
  description: string
  image: string
  readMoreUrl?: string
  order?: number
  imageAlt?: string
}

interface CastCrewCarouselProps {
  castMembers?: CastMember[];
}


export default function CastCrewCarousel({ castMembers = [] }: CastCrewCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const tickingRef = useRef(false);

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

  // Calculate active index by nearest card center to viewport center
  const updateActiveIndex = () => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const itemsContainer = scroller.firstElementChild as HTMLElement | null; // flex wrapper
    if (!itemsContainer) return;
    const children = Array.from(itemsContainer.children) as HTMLElement[];
    if (children.length === 0) return;

    const viewportCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    let nearestIdx = 0;
    let nearestDist = Infinity;
    children.forEach((el, idx) => {
      const center = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(center - viewportCenter);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    });
    setActiveIndex(nearestIdx);
  };

  // rAF-throttled onScroll handler (more reliable on iOS)
  const handleScroll = () => {
    if (tickingRef.current) return;
    tickingRef.current = true;
    requestAnimationFrame(() => {
      updateActiveIndex();
      tickingRef.current = false;
    });
  };

  // Scroll to specific card using its offset and update index immediately
  const scrollToCard = (index: number) => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const itemsContainer = scroller.firstElementChild as HTMLElement | null;
    if (!itemsContainer) return;
    const target = itemsContainer.children.item(index) as HTMLElement | null;
    if (!target) return;
    setActiveIndex(index);
    scroller.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
  };

  // Initialize on mount and when list length changes
  useEffect(() => {
    updateActiveIndex();
    const onResize = () => updateActiveIndex();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [allPeople.length]);

  // Show loading skeletons if no data yet
  if (!castMembers || castMembers.length === 0) {
    return (
      <section ref={sectionRef} className="relative py-12 bg-white md:hidden">
        <div className="px-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Meet the Cast & Crew</h2>
          <p className="text-sm text-gray-600 mb-6" aria-live="polite">
            Cast and crew details are coming soon. In the meantime, enjoy the film and check back later.
          </p>
        </div>

        <div className="relative px-6">
          <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
            <div className="flex gap-4 snap-x snap-mandatory">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex-shrink-0 w-[75%] max-w-xs snap-start">
                  <div className="bg-gray-50 rounded-xl shadow-sm p-4 text-center space-y-2 h-full border border-gray-100">
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                    <div className="pt-1">
                      <div className="h-3 bg-gray-200 rounded w-5/6 mx-auto mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-4/6 mx-auto"></div>
                    </div>
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
          onScroll={handleScroll}
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