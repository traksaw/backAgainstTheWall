import { beforeEach, describe, expect, it, vi } from 'vitest'
import { castAndCrew } from '@/data/cast-and-crew'
import { supporters as staticSupporters } from '@/data/supporters'

const fetchMock = vi.fn()
vi.mock('@/sanity/serverClient', () => ({
  serverClient: { fetch: (...args: unknown[]) => fetchMock(...args) },
}))

import { getCastAndCrew, getSupporters } from './sanity'

describe('getCastAndCrew', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('returns Sanity docs when the fetch succeeds with results', async () => {
    const docs = [{ name: 'Real Person', role: 'Director', description: 'x', order: 1 }]
    fetchMock.mockResolvedValue(docs)

    await expect(getCastAndCrew()).resolves.toEqual(docs)
  })

  it('falls back to static data when Sanity returns no docs', async () => {
    fetchMock.mockResolvedValue([])

    await expect(getCastAndCrew()).resolves.toEqual(castAndCrew)
  })

  it('falls back to static data when the fetch throws', async () => {
    fetchMock.mockRejectedValue(new Error('sanity is down'))

    await expect(getCastAndCrew()).resolves.toEqual(castAndCrew)
  })
})

describe('getSupporters', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('returns Sanity docs when the fetch succeeds with results', async () => {
    const docs = [{ name: 'Real Sponsor', type: 'foundation', logo: '/x.png', featured: true, order: 1 }]
    fetchMock.mockResolvedValue(docs)

    await expect(getSupporters()).resolves.toEqual(docs)
  })

  it('falls back to static data when Sanity returns no docs', async () => {
    fetchMock.mockResolvedValue([])

    await expect(getSupporters()).resolves.toEqual(staticSupporters)
  })

  it('falls back to static data when the fetch throws', async () => {
    fetchMock.mockRejectedValue(new Error('sanity is down'))

    await expect(getSupporters()).resolves.toEqual(staticSupporters)
  })
})
