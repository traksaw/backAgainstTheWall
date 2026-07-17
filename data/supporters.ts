import type { Supporter } from '@/types/supporter'

export const supporters: Supporter[] = [
  {
    name: "Cambodian Americans of Greater Philadelphia",
    type: "foundation",
    logo: "/logos/CAGP-logo.avif",
    description: "Supporting innovative Cambodian storytelling and cultural productions.",
    featured: true,
    order: 1
  },
  {
    name: "The Asian American Fund",
    type: "foundation",
    logo: "/logos/TAAF-logo-black.png",
    description: "Championing contemporary art and emerging Asian Americanartists.",
    featured: true,
    order: 2
  },
  {
    name: "International Media Public Fund",
    type: "foundation",
    logo: "/logos/ipmf-logo.png",
    description: "Advancing global media collaboration and innovative storytelling platforms.",
    featured: true,
    order: 3
  },
  {
    name: "Sundance Film Festival",
    type: "foundation",
    logo: "/logos/sundance-logo.png",
    description: "Celebrating independent cinema and supporting emerging filmmakers worldwide.",
    featured: true,
    order: 4
  },
  {
    name: "3 Left Handed Women",
    type: "corporate",
    logo: "/logos/3left-handed-logo.png",
    description: "Innovative creative agency specializing in film production and media services.",
    featured: true,
    order: 5
  }
]
