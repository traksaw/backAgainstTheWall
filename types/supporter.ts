export type SupporterType = 'foundation' | 'corporate' | 'community' | 'individual'

export interface Supporter {
  name: string
  type: SupporterType
  logo: string
  website?: string
  description?: string
  featured: boolean
  order: number
}
