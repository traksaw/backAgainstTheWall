import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { FadeIn, FadeInUp } from "@/components/ui/fade-in";
import { castAndCrew } from "@/data/cast-and-crew";

export default function CastCrewCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter cast (actors) and crew (production team)
  const cast = castAndCrew.filter(person =>
    person.role.toLowerCase().includes('samara') ||
    person.role.toLowerCase().includes('boyfriend') ||
    person.role.toLowerCase().includes('mom')
  );

  const crew = castAndCrew.filter(person =>
    !person.role.toLowerCase().includes('samara') &&
    !person.role.toLowerCase().includes('boyfriend') &&
    !person.role.toLowerCase().includes('mom')
  );

  // Combine cast and crew for carousel display
  const allPeople = [...cast, ...crew];

  // Handle scroll to update active dot
  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = scrollRef.current.clientWidth * 0.75; // 75% width per card
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(newIndex, allPeople.length - 1));
    }
  };

  // Scroll to specific card when dot is clicked
  const scrollToCard = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: cardWidth * index,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <section className="relative py-12 bg-white md:hidden">
      {/* Header with staggered animations */}
      <div className="px-6">
        <FadeIn delay={200} duration={800}>
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Meet the Cast & Crew
          </h2>
        </FadeIn>
        <FadeIn delay={400} duration={600}>
          <p className="text-sm text-gray-600 text-center mb-6">
            Thank you to all whose hands were involved in this exploration of young Asian-American financial psychology.
          </p>
        </FadeIn>
      </div>

      {/* Carousel layout with movie credits styling */}
      <FadeIn delay={600} duration={800}>
        <div className="relative px-6">
          {/* Gradient edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div 
            ref={scrollRef}
            className="overflow-x-auto scrollbar-hide -mx-6 px-6"
          >
            <div className="flex gap-4 snap-x snap-mandatory">
              {/* Display individual people in cards with staggered animations */}
              {allPeople.map((person, idx) => (
                <FadeIn key={idx} delay={800 + idx * 100} duration={600} direction="up">
                  <div className="flex-shrink-0 w-[75%] max-w-xs snap-start">
                    <div className="bg-gray-50 rounded-xl shadow-sm p-4 text-center space-y-2 h-full transform hover:scale-105 transition-all duration-300 hover:shadow-lg overflow-hidden">
                      {/* Movie credits style typography */}
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-2">
                          {person.name}
                        </h3>
                        <p className="text-[#B95D38] font-semibold text-xs uppercase tracking-wider line-clamp-2">
                          {person.role}
                        </p>
                      </div>

                      {/* Description */}
                      <div className="pt-1">
                        <p className="text-gray-600 text-xs leading-relaxed italic line-clamp-4 mb-2">
                          {person.description}
                        </p>
                        {person.readMoreUrl && (
                          <a
                            href={person.readMoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#B95D38] text-xs hover:underline inline-flex items-center gap-1 mt-1 font-medium transition-all duration-300 transform hover:scale-105"
                          >
                            {/* Show different text based on role type */}
                            {cast.some(c => c.name === person.name) ? 'Read more' : 'Portfolio'}
                            <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Interactive scroll indicator dots with animation */}
      <FadeInUp delay={1000} duration={600}>
        <div className="flex justify-center mt-6 space-x-2">
          {allPeople.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToCard(idx)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300 transform hover:scale-125",
                activeIndex === idx 
                  ? "bg-[#B95D38] scale-110" 
                  : "bg-gray-300 hover:bg-gray-400"
              )}
              aria-label={`Scroll to ${allPeople[idx].name}`}
            />
          ))}
        </div>
      </FadeInUp>
    </section>
  );
}