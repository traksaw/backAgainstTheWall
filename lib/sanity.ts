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
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: true,
  apiVersion: '2023-05-03',
})

const builder = imageUrlBuilder(client)
export const urlFor = (source: any) => builder.image(source)

export async function getCastAndCrew() {
  return await client.fetch(`
    *[_type == "castMember"] | order(order asc) {
      name,
      role,
      description,
      "image": image.asset->url,
      "imageAlt": image.alt,
      readMoreUrl,
      order
    }
  `)
}