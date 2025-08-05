import Image from "next/image";
import { castAndCrew } from "@/data/cast-and-crew";
import { ExternalLink } from "lucide-react";

export default function CastCrewGrid() {
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

  return (
    <section className="hidden md:block py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Meet the Cast & Crew
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Thank you to all whose hands were involved in this exploration of young Asian-American financial psychology.
          </p>
        </div>

        {/* Cast Section */}
        {cast.length > 0 && (
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-12 text-center">Cast</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {cast
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((person, index) => (
                  <div key={`cast-${index}`} className="text-center space-y-3 group">
                    <div className="space-y-2">
                      <h4 className="text-2xl font-bold text-gray-900 group-hover:text-[#B95D38] transition-colors duration-300">
                        {person.name}
                      </h4>
                      <p className="text-[#B95D38] font-semibold text-base uppercase tracking-wider">
                        {person.role}
                      </p>
                    </div>
                    <div className="pt-2">
                      <p className="text-gray-600 text-sm leading-relaxed italic max-w-sm mx-auto">
                        {person.description}
                      </p>
                      {person.readMoreUrl && (
                        <a
                          href={person.readMoreUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#B95D38] text-sm hover:underline inline-flex items-center gap-1 mt-2 font-medium"
                        >
                          Read more <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Crew Section */}
        {crew.length > 0 && (
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-12 text-center">Production Team</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {crew
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((person, index) => (
                  <div key={`crew-${index}`} className="text-center space-y-2 group">
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-[#B95D38] transition-colors duration-300">
                        {person.name}
                      </h4>
                      <p className="text-[#B95D38] font-semibold text-sm uppercase tracking-wide">
                        {person.role}
                      </p>
                    </div>
                    <div className="pt-1">
                      <p className="text-gray-600 text-xs leading-relaxed italic">
                        {person.description}
                      </p>
                      {person.readMoreUrl && (
                        <a
                          href={person.readMoreUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#B95D38] text-xs hover:underline inline-flex items-center gap-1 mt-1 font-medium"
                        >
                          Portfolio <ExternalLink className="w-2 h-2" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        </div>  
        </section>
  );
}