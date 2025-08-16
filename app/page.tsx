// app/page.tsx
import { getSupporters } from "@/lib/sanity"
import { FilmWebsiteClient } from "@/components/FilmWebsiteClient"

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Fetch data on the server side
  const supporters = await getSupporters()
  
  return <FilmWebsiteClient initialSupporters={supporters} />
}