import CastCrewCarousel from "@/components/CastCrewCarousel"
import CastCrewGrid from "@/components/CastCrewGrid"
import type { CastCrewMember } from "@/data/cast-and-crew"

interface CastCrewSectionProps {
  castMembers: CastCrewMember[]
}

export default function CastCrewSection({ castMembers }: CastCrewSectionProps) {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="block md:hidden">
          <CastCrewCarousel castMembers={castMembers} />
        </div>
        <CastCrewGrid castMembers={castMembers} />
      </div>
    </section>
  )
}
