import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { PUT } from './route'

const findOneAndUpdateMock = vi.fn()
const findByIdAndUpdateMock = vi.fn()
const leanMock = vi.fn()

vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/models/QuizResult', () => {
  const chain = { lean: (...args: unknown[]) => leanMock(...args) }
  return {
    default: {
      findOneAndUpdate: (...args: unknown[]) => {
        findOneAndUpdateMock(...args)
        return chain
      },
      findByIdAndUpdate: (...args: unknown[]) => {
        findByIdAndUpdateMock(...args)
        return chain
      },
    },
  }
})

const getUserIdFromRequestMock = vi.fn()
vi.mock('@/lib/jwt', () => ({
  getUserIdFromRequest: (...args: unknown[]) => getUserIdFromRequestMock(...args),
}))

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/quiz/result-id/update', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('PUT /api/quiz/[id]/update (WAS-6: IDOR + mass assignment)', () => {
  beforeEach(() => {
    findOneAndUpdateMock.mockClear()
    findByIdAndUpdateMock.mockClear()
    leanMock.mockReset()
    getUserIdFromRequestMock.mockReset()
  })

  it('returns 401 when there is no authenticated user', async () => {
    getUserIdFromRequestMock.mockResolvedValue(null)

    const res = await PUT(makeRequest({ hasViewedResults: true }), makeParams('result-id'))

    expect(res.status).toBe(401)
  })

  it('scopes the update query to the authenticated user, not just the record id', async () => {
    getUserIdFromRequestMock.mockResolvedValue('507f1f77bcf86cd799439011')
    leanMock.mockResolvedValue(null) // record belongs to someone else -> no match

    const res = await PUT(makeRequest({ hasViewedResults: true }), makeParams('result-id'))

    expect(findOneAndUpdateMock).toHaveBeenCalledTimes(1)
    const [filter] = findOneAndUpdateMock.mock.calls[0]
    expect(filter).toMatchObject({ _id: 'result-id' })
    expect(String(filter.userId)).toBe('507f1f77bcf86cd799439011')
    // A second user's JWT hitting another user's result must look like a 404,
    // not a 403 - don't confirm the record exists to an attacker.
    expect(res.status).toBe(404)
  })

  it('never mass-assigns unlisted fields like userId, archetype, or score', async () => {
    getUserIdFromRequestMock.mockResolvedValue('507f1f77bcf86cd799439011')
    leanMock.mockResolvedValue({ _id: 'result-id', userId: '507f1f77bcf86cd799439011', hasViewedResults: true })

    await PUT(
      makeRequest({
        hasViewedResults: true,
        userId: 'attacker-controlled-id',
        archetype: 'Architect',
        score: 999999,
      }),
      makeParams('result-id')
    )

    expect(findOneAndUpdateMock).toHaveBeenCalledTimes(1)
    const [, update] = findOneAndUpdateMock.mock.calls[0]
    expect(update).toHaveProperty('hasViewedResults', true)
    expect(update).not.toHaveProperty('userId')
    expect(update).not.toHaveProperty('archetype')
    expect(update).not.toHaveProperty('score')
  })

  it('allows a user to update their own result', async () => {
    getUserIdFromRequestMock.mockResolvedValue('507f1f77bcf86cd799439011')
    leanMock.mockResolvedValue({ _id: 'result-id', userId: '507f1f77bcf86cd799439011', hasWatchedFilm: true })

    const res = await PUT(makeRequest({ hasWatchedFilm: true }), makeParams('result-id'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.hasWatchedFilm).toBe(true)
  })
})
