import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

const findMock = vi.fn()
const sortMock = vi.fn()
const leanMock = vi.fn()

vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/models/QuizResult', () => ({
  default: {
    find: (...args: unknown[]) => {
      findMock(...args)
      return {
        sort: (...sortArgs: unknown[]) => {
          sortMock(...sortArgs)
          return { lean: (...leanArgs: unknown[]) => leanMock(...leanArgs) }
        },
      }
    },
  },
}))

const getUserIdFromRequestMock = vi.fn()
vi.mock('@/lib/jwt', () => ({
  getUserIdFromRequest: (...args: unknown[]) => getUserIdFromRequestMock(...args),
}))

function makeRequest() {
  return new NextRequest('http://localhost/api/quiz/results', { method: 'GET' })
}

const USER_A = '507f1f77bcf86cd799439011'
const USER_B = '507f191e810c19729de860ea'

describe('GET /api/quiz/results (IDOR: a user must only ever see their own results)', () => {
  beforeEach(() => {
    findMock.mockClear()
    sortMock.mockClear()
    leanMock.mockReset()
    getUserIdFromRequestMock.mockReset()
  })

  it('returns 401 when there is no authenticated user', async () => {
    getUserIdFromRequestMock.mockResolvedValue(null)

    const res = await GET(makeRequest())

    expect(res.status).toBe(401)
    expect(findMock).not.toHaveBeenCalled()
  })

  it('scopes the query to the session user, never the whole collection', async () => {
    getUserIdFromRequestMock.mockResolvedValue(USER_A)
    leanMock.mockResolvedValue([])

    await GET(makeRequest())

    expect(findMock).toHaveBeenCalledTimes(1)
    const [filter] = findMock.mock.calls[0]
    expect(String(filter.userId)).toBe(USER_A)
  })

  it("a different session only ever queries for its own user id, never another user's", async () => {
    getUserIdFromRequestMock.mockResolvedValueOnce(USER_A)
    leanMock.mockResolvedValueOnce([{ _id: 'result-a', userId: USER_A }])
    const resA = await GET(makeRequest())
    expect(String(findMock.mock.calls[0][0].userId)).toBe(USER_A)
    expect(await resA.json()).toEqual([{ _id: 'result-a', userId: USER_A }])

    getUserIdFromRequestMock.mockResolvedValueOnce(USER_B)
    leanMock.mockResolvedValueOnce([{ _id: 'result-b', userId: USER_B }])
    const resB = await GET(makeRequest())
    expect(String(findMock.mock.calls[1][0].userId)).toBe(USER_B)
    expect(await resB.json()).toEqual([{ _id: 'result-b', userId: USER_B }])
  })

  it('returns the results for the authenticated user', async () => {
    getUserIdFromRequestMock.mockResolvedValue(USER_A)
    leanMock.mockResolvedValue([{ _id: 'result-a', archetype: 'Architect' }])

    const res = await GET(makeRequest())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ _id: 'result-a', archetype: 'Architect' }])
  })
})

describe('GET /api/quiz/results (WAS-21: no internal error detail in the response)', () => {
  beforeEach(() => {
    findMock.mockClear()
    sortMock.mockClear()
    leanMock.mockReset()
    getUserIdFromRequestMock.mockReset()
    getUserIdFromRequestMock.mockResolvedValue(USER_A)
  })

  it('returns a generic error instead of the raw error message on a DB failure', async () => {
    leanMock.mockRejectedValue(new Error('connection timed out to mongodb+srv://user:pass@cluster/db'))

    const res = await GET(makeRequest())
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json).toEqual({ error: 'Failed to fetch quiz results' })
  })
})
