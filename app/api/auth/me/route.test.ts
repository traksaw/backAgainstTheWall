import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const getUserProfileMock = vi.fn()
vi.mock('@/lib/auth', () => ({
  AuthService: {
    getUserProfile: (...args: unknown[]) => getUserProfileMock(...args),
  },
}))

const getUserIdFromRequestMock = vi.fn()
vi.mock('@/lib/jwt', () => ({
  getUserIdFromRequest: (...args: unknown[]) => getUserIdFromRequestMock(...args),
}))

import { GET } from './route'

function makeRequest() {
  return new NextRequest('http://localhost/api/auth/me', { method: 'GET' })
}

describe('GET /api/auth/me (identity must come from the session, IDOR)', () => {
  beforeEach(() => {
    getUserProfileMock.mockReset()
    getUserIdFromRequestMock.mockReset()
  })

  it('returns 401 when there is no authenticated session', async () => {
    getUserIdFromRequestMock.mockResolvedValue(null)

    const res = await GET(makeRequest())

    expect(res.status).toBe(401)
    expect(getUserProfileMock).not.toHaveBeenCalled()
  })

  it('returns 404 when the session references a user that no longer exists', async () => {
    getUserIdFromRequestMock.mockResolvedValue('507f1f77bcf86cd799439011')
    getUserProfileMock.mockResolvedValue(null)

    const res = await GET(makeRequest())

    expect(res.status).toBe(404)
  })

  it("looks up only the session-derived user - a different session never sees another user's profile", async () => {
    getUserIdFromRequestMock.mockResolvedValueOnce('user-a-id')
    getUserProfileMock.mockResolvedValueOnce({ _id: 'user-a-id', email: 'a@example.com' })
    const resA = await GET(makeRequest())
    expect(getUserProfileMock).toHaveBeenNthCalledWith(1, 'user-a-id')
    expect(await resA.json()).toEqual({ _id: 'user-a-id', email: 'a@example.com' })

    getUserIdFromRequestMock.mockResolvedValueOnce('user-b-id')
    getUserProfileMock.mockResolvedValueOnce({ _id: 'user-b-id', email: 'b@example.com' })
    const resB = await GET(makeRequest())
    expect(getUserProfileMock).toHaveBeenNthCalledWith(2, 'user-b-id')
    expect(await resB.json()).toEqual({ _id: 'user-b-id', email: 'b@example.com' })
  })
})

describe('GET /api/auth/me (WAS-21: no internal error detail in the response)', () => {
  beforeEach(() => {
    getUserProfileMock.mockReset()
    getUserIdFromRequestMock.mockReset()
    getUserIdFromRequestMock.mockResolvedValue('507f1f77bcf86cd799439011')
  })

  it('returns a generic error instead of the raw error message when the profile lookup fails', async () => {
    getUserProfileMock.mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:27017'))

    const res = await GET(makeRequest())
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json).toEqual({ error: 'Failed to load user profile' })
  })
})
