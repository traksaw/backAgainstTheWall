import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface CastCrewMember {
  name: string
  role: string
  description: string
  image?: string
  readMoreUrl?: string
  order?: number
}

export function loadCastAndCrew(): CastCrewMember[] {
  const castCrewDirectory = path.join(process.cwd(), 'content/cast-and-crew')
  
  // Check if directory exists, if not return empty array
  if (!fs.existsSync(castCrewDirectory)) {
    console.warn('Cast and crew directory not found:', castCrewDirectory)
    return []
  }

  const filenames = fs.readdirSync(castCrewDirectory)
  const markdownFiles = filenames.filter(name => name.endsWith('.md'))

  const castAndCrew = markdownFiles.map(filename => {
    const filePath = path.join(castCrewDirectory, filename)
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      name: data.name || '',
      role: data.role || '',
      description: content.trim() || data.description || '',
      image: data.image || `/cast/${filename.replace('.md', '.jpg')}`,
      readMoreUrl: data.readMoreUrl,
      order: data.order || 999
    }
  })

  // Sort by order field, then by name
  return castAndCrew.sort((a, b) => {
    if (a.order !== b.order) {
      return (a.order || 999) - (b.order || 999)
    }
    return a.name.localeCompare(b.name)
  })
}

// For client-side usage (if needed)
export async function loadCastAndCrewAPI(): Promise<CastCrewMember[]> {
  try {
    const response = await fetch('/api/cast-and-crew')
    if (!response.ok) throw new Error('Failed to fetch cast and crew')
    return await response.json()
  } catch (error) {
    console.error('Error loading cast and crew:', error)
    return []
  }
}