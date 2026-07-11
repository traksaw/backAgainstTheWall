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

import { POST } from './route'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/profile', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/profile (WAS-7: identity must come from the session, not the body)', () => {
  beforeEach(() => {
    getUserProfileMock.mockReset()
    getUserIdFromRequestMock.mockReset()
  })

  it('returns 401 when there is no authenticated session', async () => {
    getUserIdFromRequestMock.mockResolvedValue(null)

    const res = await POST(makeRequest({ userId: 'anything' }))

    expect(res.status).toBe(401)
    expect(getUserProfileMock).not.toHaveBeenCalled()
  })

  it('looks up the session-derived user, ignoring any userId in the request body', async () => {
    getUserIdFromRequestMock.mockResolvedValue('507f1f77bcf86cd799439011')
    getUserProfileMock.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      email: 'me@example.com',
    })

    // An attacker (or a stale client) sends someone else's id in the body -
    // the route must never use it.
    await POST(makeRequest({ userId: 'someone-elses-id' }))

    expect(getUserProfileMock).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
  })

  it('returns 404 when the session references a user that no longer exists', async () => {
    getUserIdFromRequestMock.mockResolvedValue('507f1f77bcf86cd799439011')
    getUserProfileMock.mockResolvedValue(null)

    const res = await POST(makeRequest({}))

    expect(res.status).toBe(404)
  })
})
