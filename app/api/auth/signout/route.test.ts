import { beforeEach, describe, expect, it, vi } from 'vitest'

const cookieStoreMock = {
  get: vi.fn(),
  set: vi.fn(),
}
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(cookieStoreMock),
}))

const verifyTokenMock = vi.fn()
vi.mock('@/lib/jwt', () => ({
  verifyToken: (...args: unknown[]) => verifyTokenMock(...args),
}))

import { POST } from './route'

describe('POST /api/auth/signout', () => {
  beforeEach(() => {
    cookieStoreMock.get.mockReset()
    cookieStoreMock.set.mockReset()
    verifyTokenMock.mockReset()
  })

  it('returns 401 when there is no token cookie', async () => {
    cookieStoreMock.get.mockReturnValue(undefined)

    const res = await POST()

    expect(res.status).toBe(401)
    expect(cookieStoreMock.set).not.toHaveBeenCalled()
  })

  it('returns 401, not a crash, for an invalid/expired token', async () => {
    cookieStoreMock.get.mockReturnValue({ value: 'bad-token' })
    verifyTokenMock.mockImplementation(() => {
      throw new Error('jwt expired')
    })

    const res = await POST()

    expect(res.status).toBe(401)
    expect(cookieStoreMock.set).not.toHaveBeenCalled()
  })

  it('clears the token cookie for a valid session', async () => {
    cookieStoreMock.get.mockReturnValue({ value: 'good-token' })
    verifyTokenMock.mockReturnValue({ userId: 'user-a' })

    const res = await POST()

    expect(res.status).toBe(200)
    expect(cookieStoreMock.set).toHaveBeenCalledWith(
      'token',
      '',
      expect.objectContaining({ maxAge: 0 })
    )
  })
})
