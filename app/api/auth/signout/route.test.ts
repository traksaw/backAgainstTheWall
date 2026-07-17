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

const loggerWarnMock = vi.fn()
vi.mock('@/lib/logger', () => ({
  logger: { warn: (...args: unknown[]) => loggerWarnMock(...args) },
}))

import { POST } from './route'

describe('POST /api/auth/signout', () => {
  beforeEach(() => {
    cookieStoreMock.get.mockReset()
    cookieStoreMock.set.mockReset()
    verifyTokenMock.mockReset()
    loggerWarnMock.mockReset()
  })

  it('treats a missing token as already signed out', async () => {
    cookieStoreMock.get.mockReturnValue(undefined)

    const res = await POST()

    expect(res.status).toBe(200)
    expect(cookieStoreMock.set).toHaveBeenCalledWith(
      'token',
      '',
      expect.objectContaining({ maxAge: 0 })
    )
    expect(verifyTokenMock).not.toHaveBeenCalled()
  })

  it('treats an invalid/expired token as already signed out, not a crash', async () => {
    cookieStoreMock.get.mockReturnValue({ value: 'bad-token' })
    const verifyError = new Error('jwt expired')
    verifyTokenMock.mockImplementation(() => {
      throw verifyError
    })

    const res = await POST()

    expect(res.status).toBe(200)
    expect(cookieStoreMock.set).toHaveBeenCalledWith(
      'token',
      '',
      expect.objectContaining({ maxAge: 0 })
    )
    expect(loggerWarnMock).toHaveBeenCalledWith(expect.any(String), verifyError)
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
