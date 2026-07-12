import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchQuizContentMock = vi.fn()
vi.mock('@/lib/quiz/content', () => ({
  fetchQuizContent: (...args: unknown[]) => fetchQuizContentMock(...args),
}))

import { GET } from './route'

describe('GET /api/quiz/content', () => {
  beforeEach(() => {
    fetchQuizContentMock.mockReset()
  })

  it('returns the quiz content on success', async () => {
    fetchQuizContentMock.mockResolvedValue({ questions: [{ id: 1 }], archetypes: [] })

    const res = await GET()

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, questions: [{ id: 1 }], archetypes: [] })
  })

  it('returns a 500 with success: false instead of crashing when content loading fails', async () => {
    fetchQuizContentMock.mockRejectedValue(new Error('sanity is down'))

    const res = await GET()

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ success: false, error: 'Failed to load quiz content' })
  })
})
