import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const verifyEmailMock = vi.fn()
vi.mock('@/lib/auth', () => ({
  AuthService: {
    verifyEmail: (...args: unknown[]) => verifyEmailMock(...args),
  },
}))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeRawRequest(rawBody: string) {
  return new Request('http://localhost/api/auth/verify-email', {
    method: 'POST',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/verify-email (WAS-32)', () => {
  beforeEach(() => {
    verifyEmailMock.mockReset()
  })

  it('rejects a NoSQL-operator token payload with 400', async () => {
    const res = await POST(makeRequest({ token: { $ne: null } }))

    expect(res.status).toBe(400)
    expect(verifyEmailMock).not.toHaveBeenCalled()
  })

  it('rejects a missing token', async () => {
    const res = await POST(makeRequest({}))

    expect(res.status).toBe(400)
    expect(verifyEmailMock).not.toHaveBeenCalled()
  })

  it('rejects a non-JSON body with 400', async () => {
    const res = await POST(makeRawRequest('not-json'))

    expect(res.status).toBe(400)
    expect(verifyEmailMock).not.toHaveBeenCalled()
  })

  it('returns 400 when the service rejects an invalid or expired token', async () => {
    verifyEmailMock.mockRejectedValue(new Error('Invalid or expired token'))

    const res = await POST(makeRequest({ token: 'bad-token' }))

    expect(res.status).toBe(400)
  })

  it('verifies with a valid token', async () => {
    verifyEmailMock.mockResolvedValue(undefined)

    const res = await POST(makeRequest({ token: 'good-token' }))

    expect(verifyEmailMock).toHaveBeenCalledWith('good-token')
    expect(res.status).toBe(200)
  })
})
