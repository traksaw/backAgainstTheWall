import Image from "next/image";
import { cn } from "@/lib/utils";
import { castAndCrew } from "@/data/cast-and-crew";
import { ExternalLink } from "lucide-react";

export default function CastCrewCarousel() {
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

  return (
    <section className="relative py-12 bg-white md:hidden">
      <div className="px-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
          Meet the Cast & Crew
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Thank you to all whose hands were involved in this exploration of young Asian-American financial psychology.
        </p>
      </div>

      {/* Carousel layout with movie credits styling */}
      <div className="relative px-6">
        {/* Gradient edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10" />

        <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
          <div className="flex gap-4 snap-x snap-mandatory">
            {/* Display individual people in cards */}
            {allPeople.map((person, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-[75%] max-w-xs snap-start"
              >
                <div className="bg-gray-50 rounded-xl shadow-sm p-6 text-center space-y-3 h-full">
                  {/* Movie credits style typography */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">
                      {person.name}
                    </h3>
                    <p className="text-[#B95D38] font-semibold text-sm uppercase tracking-wider">
                      {person.role}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="pt-1">
                    {/* <p className="text-gray-600 text-xs leading-relaxed italic line-clamp-4">
                      {person.description}
                    </p> */}
                    {person.readMoreUrl && (
                      <a
                        href={person.readMoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#B95D38] text-xs hover:underline inline-flex items-center gap-1 mt-2 font-medium"
                      >
                        {/* Show different text based on role type */}
                        {cast.some(c => c.name === person.name) ? 'Read more' : 'Portfolio'}
                        <ExternalLink className="w-2 h-2" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}


          </div>
        </div>
      </div>

      {/* Scroll indicator dots */}
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: allPeople.length + 1 }).map((_, idx) => (
          <div
            key={idx}
            className="w-2 h-2 rounded-full bg-gray-300"
          />
        ))}
      </div>
    </section>
  );
}