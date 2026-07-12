import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { getUserIdFromRequest, signToken, verifyToken } from './jwt'

// Every IDOR test in this repo mocks getUserIdFromRequest to a canned userId -
// which proves routes trust the session correctly, but never proves the
// session mechanism itself is sound. These tests cover the real
// sign/verify/extract implementation those mocks stand in for.

const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret'
})

afterEach(() => {
  process.env.JWT_SECRET = ORIGINAL_JWT_SECRET
})

function requestWithCookie(token: string) {
  return new NextRequest('http://localhost/api/anything', {
    headers: { cookie: `token=${token}` },
  })
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
})
