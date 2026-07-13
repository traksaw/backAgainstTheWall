// hooks/useArchetypeIcon.ts
import { useMemo } from 'react'
import type { Archetype } from '@/types/quiz'
import {
  getArchetypeIcon as getIcon,
  ARCHETYPE_COLORS,
} from '@/lib/quiz/archetypes'

const ARCHETYPE_DESCRIPTIONS: Record<Archetype, string> = {
  Avoider: "Security-focused financial approach",
  Gambler: "Risk-taking financial approach",
  Realist: "Balanced financial approach",
  Architect: "Systematic financial approach",
}

export function useArchetypeIcon() {
  /**
   * Get the appropriate icon component for an archetype
   */
  const getArchetypeIcon = useMemo(() => getIcon, [])

  /**
   * Get icon with additional metadata
   */
  const getArchetypeIconWithMeta = useMemo(() => {
    return (archetype: string) => {
      const IconComponent = getArchetypeIcon(archetype)
      const colors = ARCHETYPE_COLORS[archetype as Archetype]

      return {
        icon: IconComponent,
        color: colors?.text || "text-gray-600",
        bgColor: colors?.bg || "bg-gray-100",
        description: ARCHETYPE_DESCRIPTIONS[archetype as Archetype] || "Financial approach"
      }
    }
  }, [getArchetypeIcon])

  /**
   * Get all archetype icons (useful for legends, lists, etc.)
   */
  const getAllArchetypeIcons = useMemo(() => {
    const archetypes: Archetype[] = ["Avoider", "Gambler", "Realist", "Architect"]
    
    return archetypes.map(archetype => ({
      archetype,
      ...getArchetypeIconWithMeta(archetype)
    }))
  }, [getArchetypeIconWithMeta])

  return {
    getArchetypeIcon,
    getArchetypeIconWithMeta, 
    getAllArchetypeIcons
  }
}