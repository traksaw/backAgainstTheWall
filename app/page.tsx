import { getSupporters, getCastAndCrew } from "@/lib/sanity"
import { HomeInteractiveShell } from "@/components/home/HomeInteractiveShell"
import CastCrewSection from "@/components/home/CastCrewSection"
import ContactSocialSection from "@/components/home/ContactSocialSection"

export default async function Page() {
  const castMembers = await getCastAndCrew()
  const supporters = await getSupporters()

  return (
    <HomeInteractiveShell supporters={supporters}>
      <CastCrewSection castMembers={castMembers} />
      <ContactSocialSection />
    </HomeInteractiveShell>
  )
}
