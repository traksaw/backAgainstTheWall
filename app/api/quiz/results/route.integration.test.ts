import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { signToken } from '@/lib/jwt'
import { GET } from './route'

// Every other test in this suite mocks getUserIdFromRequest to a canned
// userId. This one doesn't: it signs a real JWT, puts it on a real cookie,
// and lets the real signToken/verifyToken/getUserIdFromRequest chain decide
// who the caller is - proving the whole session pipeline enforces ownership
// end to end, not just each half of it in isolation.

const findMock = vi.fn()
const sortMock = vi.fn()
const leanMock = vi.fn()

const findByIdMock = vi.fn()
const selectMock = vi.fn()
const userLeanMock = vi.fn()

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

// WAS-88: getUserIdFromRequest (exercised for real in this file, unlike
// every other route test) now reads passwordChangedAt off the user before
// trusting the session - mirrors the mock chain in lib/jwt.test.ts. Every
// test here that reaches this call is a real user who's never reset their
// password, so the default keeps their session valid and lets the existing
// ownership-scoping assertions pass unchanged.
vi.mock('@/models/User', () => ({
  default: {
    findById: (...args: unknown[]) => {
      findByIdMock(...args)
      return {
        select: (...selectArgs: unknown[]) => {
          selectMock(...selectArgs)
          return { lean: () => userLeanMock() }
        },
      }
    },
  },
}))

const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET
const USER_A = '507f1f77bcf86cd799439011'
const USER_B = '507f191e810c19729de860ea'

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret'
  findMock.mockClear()
  sortMock.mockClear()
  leanMock.mockReset()
  findByIdMock.mockReset()
  selectMock.mockReset()
  userLeanMock.mockReset()
  userLeanMock.mockResolvedValue({ passwordChangedAt: undefined })
})

afterEach(() => {
  process.env.JWT_SECRET = ORIGINAL_JWT_SECRET
})

function requestWithSessionFor(userId: string) {
  const token = signToken({ userId })
  return new NextRequest('http://localhost/api/quiz/results', {
    headers: { cookie: `token=${token}` },
  })
}

describe('GET /api/quiz/results, full session round-trip (no mocked jwt layer)', () => {
  it('returns 401 with no session cookie at all', async () => {
    const res = await GET(new NextRequest('http://localhost/api/quiz/results'))

    expect(res.status).toBe(401)
    expect(findMock).not.toHaveBeenCalled()
  })

  it("a real signed-in session for user A queries only user A's data", async () => {
    leanMock.mockResolvedValue([{ _id: 'result-a', userId: USER_A }])

    const res = await GET(requestWithSessionFor(USER_A))

    expect(res.status).toBe(200)
    expect(String(findMock.mock.calls[0][0].userId)).toBe(USER_A)
  })

  it("a different real signed-in session for user B queries only user B's data, never user A's", async () => {
    leanMock.mockResolvedValue([{ _id: 'result-b', userId: USER_B }])

    const res = await GET(requestWithSessionFor(USER_B))

    expect(res.status).toBe(200)
    expect(String(findMock.mock.calls[0][0].userId)).toBe(USER_B)
  })

  it('rejects a tampered token as unauthenticated rather than resolving it to any user', async () => {
    const token = signToken({ userId: USER_A })
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a')
    const req = new NextRequest('http://localhost/api/quiz/results', {
      headers: { cookie: `token=${tampered}` },
    })

    const res = await GET(req)

    expect(res.status).toBe(401)
    expect(findMock).not.toHaveBeenCalled()
  })
})
