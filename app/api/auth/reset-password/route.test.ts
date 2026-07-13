import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const resetPasswordMock = vi.fn()
vi.mock('@/lib/auth', () => ({
  AuthService: {
    resetPassword: (...args: unknown[]) => resetPasswordMock(...args),
  },
}))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeRawRequest(rawBody: string) {
  return new Request('http://localhost/api/auth/reset-password', {
    method: 'POST',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/reset-password (WAS-32)', () => {
  beforeEach(() => {
    resetPasswordMock.mockReset()
  })

  it('rejects a NoSQL-operator token payload with 400', async () => {
    const res = await POST(makeRequest({ token: { $ne: null }, password: 'x' }))

    expect(res.status).toBe(400)
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('rejects a missing password', async () => {
    const res = await POST(makeRequest({ token: 'abc' }))

    expect(res.status).toBe(400)
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('rejects a password shorter than 8 characters', async () => {
    const res = await POST(makeRequest({ token: 'good-token', password: 'abc123' }))

    expect(res.status).toBe(400)
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('rejects a password without a digit', async () => {
    const res = await POST(makeRequest({ token: 'good-token', password: 'nodigits' }))

    expect(res.status).toBe(400)
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('rejects a non-JSON body with 400', async () => {
    const res = await POST(makeRawRequest('not-json'))

    expect(res.status).toBe(400)
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('returns 400 when the service rejects an invalid or expired token', async () => {
    resetPasswordMock.mockRejectedValue(new Error('Invalid or expired token'))

    const res = await POST(makeRequest({ token: 'bad-token', password: 'newpassword123' }))

    expect(res.status).toBe(400)
  })

  it('resets the password with a valid token', async () => {
    resetPasswordMock.mockResolvedValue(undefined)

    const res = await POST(makeRequest({ token: 'good-token', password: 'newpassword123' }))

    expect(resetPasswordMock).toHaveBeenCalledWith('good-token', 'newpassword123')
    expect(res.status).toBe(200)
  })

  it('returns 500 and a generic message for an unexpected error, without leaking it', async () => {
    resetPasswordMock.mockRejectedValue(new Error('connection to Mongo lost'))

    const res = await POST(makeRequest({ token: 'good-token', password: 'newpassword123' }))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Something went wrong')
  })
})
