import { createClient } from '@sanity/client'

// Validate environment variables
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

if (!projectId) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable')
  // In development, you might want to throw an error
  // In production, we'll handle it gracefully
}

// Create client only if we have required config
const client = projectId ? createClient({
  projectId,
  dataset,
  apiVersion: '2023-05-03',
  useCdn: process.env.NODE_ENV === 'production',
}) : null

export async function getCastAndCrew() {
  // Return empty array if no client available
  if (!client) {
    console.warn('Sanity client not configured - returning empty cast list')
    return []
  }

  try {
    const castMembers = await client.fetch(`
      *[_type == "castMember"] | order(order asc) {
        name,
        role,
        description,
        "image": image.asset->url,
        readMoreUrl,
        order
      }
    `)
    return Array.isArray(castMembers) ? castMembers : []
  } catch (error) {
    console.error('Error fetching cast and crew:', error)
    return []
  }
}

export default client