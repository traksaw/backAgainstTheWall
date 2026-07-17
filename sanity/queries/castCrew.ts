import { groq } from 'next-sanity'

export const CAST_CREW_QUERY = groq`
  *[_type == "castMember"] | order(order asc) {
    name,
    role,
    description,
    "image": image.asset->url,
    readMoreUrl,
    order
  }
`
