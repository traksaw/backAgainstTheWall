import { serverClient } from '@/sanity/serverClient'
import { CAST_CREW_QUERY } from '@/sanity/queries/castCrew'
import { SUPPORTERS_QUERY } from '@/sanity/queries/supporters'
import { castAndCrew, type CastCrewMember } from '@/data/cast-and-crew'
import { supporters as staticSupporters } from '@/data/supporters'
import type { Supporter } from '@/types/supporter'

export type { CastCrewMember }

export async function getCastAndCrew(): Promise<CastCrewMember[]> {
  try {
    const docs = await serverClient.fetch<CastCrewMember[]>(CAST_CREW_QUERY)
    return docs?.length ? docs : castAndCrew
  } catch (error) {
    console.error('Failed to fetch cast and crew from Sanity, using static fallback', error)
    return castAndCrew
  }
}

export async function getSupporters(): Promise<Supporter[]> {
  try {
    const docs = await serverClient.fetch<Supporter[]>(SUPPORTERS_QUERY)
    return docs?.length ? docs : staticSupporters
  } catch (error) {
    console.error('Failed to fetch supporters from Sanity, using static fallback', error)
    return staticSupporters
  }
}
