// hooks/useArchetypeIcon.ts
import { useMemo } from 'react'
import { Shield, TrendingUp, Target, Eye, Award } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Archetype } from '@/types/quiz'

export function useArchetypeIcon() {
  /**
   * Get the appropriate icon component for an archetype
   */
  const getArchetypeIcon = useMemo(() => {
    return (archetype: string): LucideIcon => {
      switch (archetype) {
        case "Avoider":
          return Shield
        case "Gambler":
          return TrendingUp
        case "Realist":
          return Target
        case "Architect":
          return Eye
        default:
          return Award
      }
    }
  }, [])

  /**
   * Get icon with additional metadata
   */
  const getArchetypeIconWithMeta = useMemo(() => {
    return (archetype: string) => {
      const IconComponent = getArchetypeIcon(archetype)
      
      const metadata = {
        Avoider: {
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          description: "Security-focused financial approach"
        },
        Gambler: {
          color: "text-red-600", 
          bgColor: "bg-red-100",
          description: "Risk-taking financial approach"
        },
        Realist: {
          color: "text-green-600",
          bgColor: "bg-green-100", 
          description: "Balanced financial approach"
        },
        Architect: {
          color: "text-purple-600",
          bgColor: "bg-purple-100",
          description: "Systematic financial approach"
        }
      }

      return {
        icon: IconComponent,
        color: metadata[archetype as keyof typeof metadata]?.color || "text-gray-600",
        bgColor: metadata[archetype as keyof typeof metadata]?.bgColor || "bg-gray-100",
        description: metadata[archetype as keyof typeof metadata]?.description || "Financial approach"
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