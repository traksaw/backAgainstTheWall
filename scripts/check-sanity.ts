// Local-only replacement for the old public `/test-sanity` debug route
// (removed in WAS-31). Run with `pnpm check-sanity` to eyeball the data
// getCastAndCrew()/getSupporters() would hand to the homepage (live Sanity
// content if present, static fallback otherwise), without exposing a live,
// unauthenticated route in production.
import { getCastAndCrew, getSupporters } from '../lib/sanity'

async function main() {
  const [castAndCrew, supporters] = await Promise.all([getCastAndCrew(), getSupporters()])

  console.log(`\nCast & crew (${castAndCrew.length}):`)
  console.log(JSON.stringify(castAndCrew, null, 2))

  console.log(`\nSupporters (${supporters.length}):`)
  console.log(JSON.stringify(supporters, null, 2))
}

main().catch((err) => {
  console.error('Failed to fetch Sanity data:', err)
  process.exit(1)
})
