import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export interface CastMember {
  name: string;
  role: string;
  description: string;
  image: string;
  readMoreUrl?: string;
  order: number;
}
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'u6u93177',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: true,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-08-10',
})

const builder = imageUrlBuilder(client)
export const urlFor = (source: any) => builder.image(source)

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
    `, {}, {
      next: { 
        revalidate: 60, // Cache for 60 seconds
        tags: ['cast-and-crew'] // Tag for webhook revalidation
      }
    })
    return Array.isArray(castMembers) ? castMembers : []
  } catch (error) {
    console.error('Error fetching cast and crew:', error)
    return []
  }
}

export async function getSupporters() {
  // Return empty array if no client available
  if (!client) {
    console.warn('Sanity client not configured - returning empty supporters list')
    return []
  }

  try {
    const supporters = await client.fetch(`
      *[_type == "supporter"] | order(order asc) {
        name,
        type,
        "logo": logo.asset->url,
        website,
        description,
        featured,
        order
      }
    `, {}, {
      next: { 
        revalidate: 60, // Cache for 60 seconds
        tags: ['supporters'] // Tag for webhook revalidation
      }
    })
    return Array.isArray(supporters) ? supporters : []
  } catch (error) {
    console.error('Error fetching supporters:', error)
    return []
  }
}