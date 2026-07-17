import { groq } from 'next-sanity'

export const SUPPORTERS_QUERY = groq`
  *[_type == "supporter"] | order(order asc) {
    name,
    type,
    "logo": logo.asset->url,
    website,
    description,
    featured,
    order
  }
`
