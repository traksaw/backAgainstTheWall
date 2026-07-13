import { describe, expect, it } from 'vitest'
import {
  ARCHETYPE_COLORS,
  getArchetypeColor,
  getArchetypeIcon,
  getArchetypeSolidColor,
} from './archetypes'
import type { Archetype } from '@/types/quiz'

const ARCHETYPES: Archetype[] = ['Avoider', 'Gambler', 'Realist', 'Architect']

/**
 * WAS-24: these maps had silently diverged across five call sites (one
 * still had Architect as yellow after the others moved to purple). These
 * tests pin every variant to the same hue per archetype so a hand-copied
 * override elsewhere can't reintroduce that drift undetected.
 */
describe('archetype display (WAS-24 regression guard)', () => {
  it('gives every archetype a distinct icon', () => {
    const icons = ARCHETYPES.map(getArchetypeIcon)
    expect(new Set(icons).size).toBe(ARCHETYPES.length)
  })

  it('keeps badge/solid/text/bg classes on the same hue per archetype', () => {
    for (const archetype of ARCHETYPES) {
      const { badge, solid, text, bg } = ARCHETYPE_COLORS[archetype]
      const hue = badge.match(/bg-(\w+)-100/)?.[1]
      expect(hue, `${archetype} badge should be bg-{hue}-100`).toBeTruthy()
      expect(solid).toBe(`bg-${hue}-500`)
      expect(text).toBe(`text-${hue}-600`)
      expect(bg).toBe(`bg-${hue}-100`)
    }
  })

  it('pins Architect to purple, not yellow', () => {
    expect(getArchetypeColor('Architect')).toContain('purple')
    expect(getArchetypeSolidColor('Architect')).toBe('bg-purple-500')
  })

  it('falls back to gray for an unknown archetype', () => {
    expect(getArchetypeColor('Unknown')).toContain('gray')
    expect(getArchetypeSolidColor('Unknown')).toContain('gray')
  })
})
