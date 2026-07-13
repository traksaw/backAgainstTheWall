import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'
import { POST } from './route'

const requestPasswordResetMock = vi.fn()
vi.mock('@/lib/auth', () => ({
  AuthService: {
    requestPasswordReset: (...args: unknown[]) => requestPasswordResetMock(...args),
  },
}))

const checkRateLimitMock = vi.fn()
vi.mock('@/lib/rate-limit', () => ({
  emailLimiter: {},
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  getClientIp: () => '127.0.0.1',
  tooManyRequests: (retryAfterSeconds: number) =>
    NextResponse.json(
      { error: `Too many attempts. Try again in ${retryAfterSeconds} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    ),
}))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/request-reset', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeRawRequest(rawBody: string) {
  return new Request('http://localhost/api/auth/request-reset', {
    method: 'POST',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/request-reset (WAS-32)', () => {
  beforeEach(() => {
    requestPasswordResetMock.mockReset()
    checkRateLimitMock.mockReset().mockResolvedValue({ allowed: true })
  })

  it('returns 429 with Retry-After when rate limited, without calling requestPasswordReset', async () => {
    checkRateLimitMock.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 42 })

    const res = await POST(makeRequest({ email: 'me@example.com' }))

    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('42')
    expect(requestPasswordResetMock).not.toHaveBeenCalled()
  })

  it('rejects a NoSQL-operator email payload with 400 instead of querying the database', async () => {
    const res = await POST(makeRequest({ email: { $ne: null } }))

    expect(res.status).toBe(400)
    expect(requestPasswordResetMock).not.toHaveBeenCalled()
  })

  it('rejects a non-email string', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email' }))

    expect(res.status).toBe(400)
    expect(requestPasswordResetMock).not.toHaveBeenCalled()
  })

  it('rejects a non-JSON body with 400 instead of crashing', async () => {
    const res = await POST(makeRawRequest('not-json'))

    expect(res.status).toBe(400)
    expect(requestPasswordResetMock).not.toHaveBeenCalled()
  })

  it('returns the same generic success message whether or not the email exists', async () => {
    requestPasswordResetMock.mockResolvedValue(undefined)

    const res = await POST(makeRequest({ email: 'me@example.com' }))
    const body = await res.json()

    expect(requestPasswordResetMock).toHaveBeenCalledWith('me@example.com')
    expect(res.status).toBe(200)
    expect(body.message).toMatch(/if an account exists/i)
  })
})
