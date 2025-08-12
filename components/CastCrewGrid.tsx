import { ExternalLink } from "lucide-react";
import { FadeIn, FadeInUp } from "@/components/ui/fade-in";

interface CastMember {
  name: string;
  role: string;
  description: string;
  image: string;
  readMoreUrl?: string;
  order: number;
}

interface CastCrewGridProps {
  castMembers: CastMember[];
}

export default function CastCrewGrid({ castMembers }: CastCrewGridProps) {
  // Filter cast (actors) and crew (production team) from props
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

  // Return null if no cast members provided
  if (!castMembers || castMembers.length === 0) {
    return (
      <section className="hidden md:block py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B95D38] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading cast and crew information...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hidden md:block py-24 bg-white">
      <div className="container mx-auto px-6">
        <FadeInUp delay={200} duration={800}>
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Meet the Cast & Crew
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Thank you to all whose hands were involved in this exploration of young Asian-American financial psychology.
            </p>
          </div>
        </FadeInUp>

        {/* Cast Section */}
        {cast.length > 0 && (
          <div className="mb-16">
            <FadeInUp delay={400} duration={800}>
              <h3 className="text-3xl font-bold text-gray-900 mb-12 text-center">Cast</h3>
            </FadeInUp>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {cast
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((person, index) => (
                  <FadeIn
                    key={`cast-${index}`}
                    delay={600 + index * 150}
                    duration={800}
                    direction="up"
                  >
                    <div className="text-center space-y-3 group hover:transform hover:scale-105 transition-all duration-300">
                      {/* Only show image if it exists */}
                      {person.image && (
                        <img 
                          src={person.image} 
                          alt={person.name}
                          className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                        />
                      )}
                      
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
                            className="text-[#B95D38] text-sm hover:underline inline-flex items-center gap-1 mt-2 font-medium transition-all duration-300 hover:text-[#B95D38]/80"
                          >
                            Read more <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </FadeIn>
                ))}
            </div>
          </div>
        )}

        {/* Crew Section */}
        {crew.length > 0 && (
          <div>
            <FadeInUp delay={400} duration={800}>
              <h3 className="text-3xl font-bold text-gray-900 mb-12 text-center">Production Team</h3>
            </FadeInUp>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {crew
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((person, index) => (
                  <FadeIn
                    key={`crew-${index}`}
                    delay={600 + index * 100}
                    duration={600}
                    direction="up"
                  >
                    <div className="text-center space-y-2 group hover:transform hover:scale-105 transition-all duration-300">
                      {/* Only show image if it exists */}
                      {person.image && (
                        <img 
                          src={person.image} 
                          alt={person.name}
                          className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                        />
                      )}
                      
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
                            className="text-[#B95D38] text-xs hover:underline inline-flex items-center gap-1 mt-1 font-medium transition-all duration-300 hover:text-[#B95D38]/80"
                          >
                            Portfolio <ExternalLink className="w-2 h-2" />
                          </a>
                        )}
                      </div>
                    </div>
                  </FadeIn>
                ))}
            </div>
          </div>
        )}
      </div>  
    </section>  
  );
}