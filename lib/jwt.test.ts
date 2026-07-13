import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

// Every IDOR test in this repo mocks getUserIdFromRequest to a canned userId -
// which proves routes trust the session correctly, but never proves the
// session mechanism itself is sound. These tests cover the real
// sign/verify/extract implementation those mocks stand in for.

const findByIdMock = vi.fn()
const selectMock = vi.fn()
const leanMock = vi.fn()

vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

// WAS-88: getUserIdFromRequest now reads passwordChangedAt to reject tokens
// issued before the user's last password reset - this mock chain mirrors
// User.findById(id).select('passwordChangedAt').lean() from lib/jwt.ts.
vi.mock('@/models/User', () => ({
  default: {
    findById: (...args: unknown[]) => {
      findByIdMock(...args)
      return {
        select: (...selectArgs: unknown[]) => {
          selectMock(...selectArgs)
          return { lean: () => leanMock() }
        },
      }
    },
  },
}))

import { getUserIdFromRequest, signToken, verifyToken } from './jwt'

const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret'
  findByIdMock.mockReset()
  selectMock.mockReset()
  leanMock.mockReset()
  // Default: a user who has never reset their password - every valid token
  // is accepted. Individual tests override this to exercise the stale-token
  // and deleted-user cases.
  leanMock.mockResolvedValue({ passwordChangedAt: undefined })
})

afterEach(() => {
  process.env.JWT_SECRET = ORIGINAL_JWT_SECRET
})

function requestWithCookie(token: string) {
  return new NextRequest('http://localhost/api/anything', {
    headers: { cookie: `token=${token}` },
  })
}

// signToken always lets jsonwebtoken stamp the current time as `iat`, so
// tests that need to control iat relative to a fixed passwordChangedAt sign
// the token directly - the same escape hatch the existing "different secret"
// test above uses via a bare jwt.sign() call. Note: `noTimestamp: true`
// would NOT work here - in jsonwebtoken@9 that option deletes any `iat`
// already on the payload rather than preserving it (sign.js explicitly does
// `if (options.noTimestamp) delete payload.iat`). Omitting the option is
// what makes jsonwebtoken keep our caller-supplied `iat` instead of
// overwriting it with the current time.
function tokenWithIat(userId: string, iat: number) {
  return jwt.sign({ userId, iat }, 'test-secret')
}

describe('signToken / verifyToken', () => {
  it('round-trips a userId through sign and verify', () => {
    const token = signToken({ userId: 'user-a' })
    expect(verifyToken(token).userId).toBe('user-a')
  })

  it('throws on a token signed with a different secret', () => {
    const foreignToken = jwt.sign({ userId: 'user-a' }, 'a-different-secret')
    expect(() => verifyToken(foreignToken)).toThrow()
  })

  it('throws on an expired token', () => {
    const expiredToken = signToken({ userId: 'user-a' }, { expiresIn: -1 })
    expect(() => verifyToken(expiredToken)).toThrow()
  })

  it('throws on a tampered token', () => {
    const token = signToken({ userId: 'user-a' })
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a')
    expect(() => verifyToken(tampered)).toThrow()
  })
})

describe('getUserIdFromRequest (the session boundary every route/IDOR check relies on)', () => {
  it('returns null when there is no token cookie', async () => {
    const req = new NextRequest('http://localhost/api/anything')
    expect(await getUserIdFromRequest(req)).toBeNull()
  })

  it('returns the userId for a valid token cookie', async () => {
    const token = signToken({ userId: 'user-a' })
    expect(await getUserIdFromRequest(requestWithCookie(token))).toBe('user-a')
  })

  it('returns null, not a thrown error, for an expired token cookie', async () => {
    const token = signToken({ userId: 'user-a' }, { expiresIn: -1 })
    expect(await getUserIdFromRequest(requestWithCookie(token))).toBeNull()
  })

  it('returns null, not a thrown error, for a tampered token cookie', async () => {
    const token = signToken({ userId: 'user-a' })
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a')
    expect(await getUserIdFromRequest(requestWithCookie(tampered))).toBeNull()
  })

  it("never resolves one user's token to a different user's id", async () => {
    const tokenA = signToken({ userId: 'user-a' })
    const tokenB = signToken({ userId: 'user-b' })

    expect(await getUserIdFromRequest(requestWithCookie(tokenA))).toBe('user-a')
    expect(await getUserIdFromRequest(requestWithCookie(tokenB))).toBe('user-b')
  })

  it('queries only the passwordChangedAt field, by the token\'s userId', async () => {
    const token = signToken({ userId: 'user-a' })

    await getUserIdFromRequest(requestWithCookie(token))

    expect(findByIdMock).toHaveBeenCalledWith('user-a')
    expect(selectMock).toHaveBeenCalledWith('passwordChangedAt')
  })
})

describe('getUserIdFromRequest session invalidation on password reset (WAS-88)', () => {
  it('rejects a token whose iat predates the user\'s passwordChangedAt', async () => {
    leanMock.mockResolvedValue({ passwordChangedAt: new Date('2026-01-02T00:00:00Z') })
    const staleIat = Math.floor(new Date('2026-01-01T00:00:00Z').getTime() / 1000)
    const token = tokenWithIat('user-a', staleIat)

    expect(await getUserIdFromRequest(requestWithCookie(token))).toBeNull()
  })

  it('accepts a token whose iat is at or after the user\'s passwordChangedAt', async () => {
    leanMock.mockResolvedValue({ passwordChangedAt: new Date('2026-01-01T00:00:00Z') })
    const freshIat = Math.floor(new Date('2026-01-02T00:00:00Z').getTime() / 1000)
    const token = tokenWithIat('user-a', freshIat)

    expect(await getUserIdFromRequest(requestWithCookie(token))).toBe('user-a')
  })

  it('accepts any valid token when the user has never reset their password', async () => {
    leanMock.mockResolvedValue({ passwordChangedAt: undefined })
    const token = signToken({ userId: 'user-a' })

    expect(await getUserIdFromRequest(requestWithCookie(token))).toBe('user-a')
  })

  it('returns null when the token\'s user no longer exists', async () => {
    leanMock.mockResolvedValue(null)
    const token = signToken({ userId: 'user-a' })

    expect(await getUserIdFromRequest(requestWithCookie(token))).toBeNull()
  })
})
