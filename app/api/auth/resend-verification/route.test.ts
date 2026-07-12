import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const resendVerificationMock = vi.fn()
vi.mock('@/lib/auth', () => ({
  AuthService: {
    resendVerification: (...args: unknown[]) => resendVerificationMock(...args),
  },
}))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeRawRequest(rawBody: string) {
  return new Request('http://localhost/api/auth/resend-verification', {
    method: 'POST',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/resend-verification (WAS-32)', () => {
  beforeEach(() => {
    resendVerificationMock.mockReset()
  })

  it('rejects a NoSQL-operator email payload with 400', async () => {
    const res = await POST(makeRequest({ email: { $ne: null } }))

    expect(res.status).toBe(400)
    expect(resendVerificationMock).not.toHaveBeenCalled()
  })

  it('rejects a non-email string', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email' }))

    expect(res.status).toBe(400)
    expect(resendVerificationMock).not.toHaveBeenCalled()
  })

  it('rejects a non-JSON body with 400', async () => {
    const res = await POST(makeRawRequest('not-json'))

    expect(res.status).toBe(400)
    expect(resendVerificationMock).not.toHaveBeenCalled()
  })

  it('returns the same generic success message whether or not the email exists', async () => {
    resendVerificationMock.mockResolvedValue(undefined)

    const res = await POST(makeRequest({ email: 'me@example.com' }))
    const body = await res.json()

    expect(resendVerificationMock).toHaveBeenCalledWith('me@example.com')
    expect(res.status).toBe(200)
    expect(body.message).toMatch(/if an account exists/i)
  })
})
