import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import { castAndCrew } from '@/data/cast-and-crew'
// Use hardcoded values for development to ensure consistency
const config = {
  projectId: 'u6u93177',
  dataset: 'production',
  apiVersion: '2023-05-03',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN // Add token for dataset creation
}

export interface CastMember {
  name: string;
  role: string;
  description: string;
  image: string;
  readMoreUrl?: string;
  order: number;
}

// Create Sanity client with hardcoded config
export const client = createClient(config)

interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
}

const builder = client ? imageUrlBuilder(client) : null

export const urlFor = (source: string | SanityImage) => {
  if (!builder) {
    // Return a fallback URL if no client is available
    return { url: () => source.toString() }
  }
  return builder.image(source)
}

// Static fallback data
const fallbackSupporters = [
  {
    name: "Cambodian Americans of Greater Philadelphia",
    type: "foundation" as const,
    logo: "/logos/CAGP-logo.avif",
    description: "Supporting innovative Cambodian storytelling and cultural productions.",
    featured: true,
    order: 1
  },
  {
    name: "The Asian American Fund",
    type: "foundation" as const,
    logo: "/logos/TAAF-logo-black.png",
    description: "Championing contemporary art and emerging Asian Americanartists.",
    featured: true,
    order: 2
  },
  {
    name: "International Media Public Fund",
    type: "foundation" as const,
    logo: "/logos/ipmf-logo.png",
    description: "Advancing global media collaboration and innovative storytelling platforms.",
    featured: true,
    order: 3
  },
  {
    name: "Sundance Film Festival",
    type: "foundation" as const,
    logo: "/logos/sundance-logo.png",
    description: "Celebrating independent cinema and supporting emerging filmmakers worldwide.",
    featured: true,
    order: 4
  },
  {
    name: "3 Left Handed Women",
    type: "corporate" as const,
    logo: "/logos/3left-handed-logo.png",
    description: "Innovative creative agency specializing in film production and media services.",
    featured: true,
    order: 5
  }
]

export async function getCastAndCrew() {
  // For now, always use fallback data to avoid API errors
  console.log('Using fallback cast data (Sanity temporarily disabled)')
  return castAndCrew
}

export async function getSupporters() {
  // For now, always use fallback data to avoid API errors
  console.log('Using fallback supporters data (Sanity temporarily disabled)')
  return fallbackSupporters
}