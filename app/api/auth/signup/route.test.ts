import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'
import { POST } from './route'

const signUpMock = vi.fn()
vi.mock('@/lib/auth', () => {
  class DuplicateAccountError extends Error {
    constructor() {
      super('Unable to complete sign up. Please try again.')
      this.name = 'DuplicateAccountError'
    }
  }
  return {
    AuthService: {
      signUp: (...args: unknown[]) => signUpMock(...args),
    },
    DuplicateAccountError,
  }
})

const captureExceptionMock = vi.fn()
vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureExceptionMock(...args),
}))

import { DuplicateAccountError } from '@/lib/auth'

vi.mock('@/lib/jwt', () => ({
  signToken: vi.fn().mockReturnValue('signed-token'),
}))

const checkRateLimitMock = vi.fn()
vi.mock('@/lib/rate-limit', () => ({
  authLimiter: {},
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  getClientIp: () => '127.0.0.1',
  tooManyRequests: (retryAfterSeconds: number) =>
    NextResponse.json(
      { error: `Too many attempts. Try again in ${retryAfterSeconds} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    ),
}))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeRawRequest(rawBody: string) {
  return new Request('http://localhost/api/auth/signup', {
    method: 'POST',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  })
}

const validPayload = {
  email: 'me@example.com',
  password: 'hunter22',
  firstName: 'A',
  lastName: 'B',
  zip_code: '90210',
  occupationStatus: 'employed',
}

describe('POST /api/auth/signup (WAS-8: reject non-string bodies before they reach Mongoose)', () => {
  beforeEach(() => {
    signUpMock.mockReset()
    checkRateLimitMock.mockReset().mockResolvedValue({ allowed: true })
    captureExceptionMock.mockReset()
  })

  it('returns 429 with Retry-After when rate limited, without calling signUp', async () => {
    checkRateLimitMock.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 42 })

    const res = await POST(makeRequest(validPayload))

    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('42')
    expect(signUpMock).not.toHaveBeenCalled()
  })

  it('rejects a NoSQL-operator email payload with 400 instead of querying the database', async () => {
    const res = await POST(makeRequest({ ...validPayload, email: { $ne: null } }))

    expect(res.status).toBe(400)
    expect(signUpMock).not.toHaveBeenCalled()
  })

  it('rejects a payload missing required fields', async () => {
    const res = await POST(makeRequest({ email: 'me@example.com', password: 'hunter2' }))

    expect(res.status).toBe(400)
    expect(signUpMock).not.toHaveBeenCalled()
  })

  it('rejects a password shorter than 8 characters', async () => {
    const res = await POST(makeRequest({ ...validPayload, password: 'abc123' }))

    expect(res.status).toBe(400)
    expect(signUpMock).not.toHaveBeenCalled()
  })

  it('rejects a password without a digit', async () => {
    const res = await POST(makeRequest({ ...validPayload, password: 'nodigits' }))

    expect(res.status).toBe(400)
    expect(signUpMock).not.toHaveBeenCalled()
  })

  it('rejects a non-JSON body with 400 instead of crashing', async () => {
    const res = await POST(makeRawRequest('not-json'))

    expect(res.status).toBe(400)
    expect(signUpMock).not.toHaveBeenCalled()
  })

  it('signs up with a valid payload', async () => {
    signUpMock.mockResolvedValue({
      _id: { toString: () => 'user-a' },
      email: 'me@example.com',
      first_name: 'A',
      last_name: 'B',
    })

    const res = await POST(makeRequest(validPayload))

    expect(signUpMock).toHaveBeenCalledWith(validPayload)
    expect(res.status).toBe(200)
    // A passing status with no session cookie is a broken signup a client
    // can't detect - assert the actual side effect that makes it useful.
    expect(res.cookies.get('token')?.value).toBe('signed-token')
  })
})

describe('POST /api/auth/signup (WAS-20: never reveal account existence)', () => {
  beforeEach(() => {
    signUpMock.mockReset()
    checkRateLimitMock.mockReset().mockResolvedValue({ allowed: true })
    captureExceptionMock.mockReset()
  })

  it('returns the same generic message for a duplicate email as any other signup failure, and skips Sentry', async () => {
    signUpMock.mockRejectedValue(new DuplicateAccountError())

    const res = await POST(makeRequest(validPayload))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).not.toMatch(/already exists/i)
    expect(captureExceptionMock).not.toHaveBeenCalled()
  })

  it('still reports genuine failures (e.g. DB errors) to Sentry', async () => {
    signUpMock.mockRejectedValue(new Error('ECONNREFUSED'))

    const res = await POST(makeRequest(validPayload))

    expect(res.status).toBe(400)
    expect(captureExceptionMock).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/auth/signup (WAS-44: no internal error detail in the response)', () => {
  beforeEach(() => {
    signUpMock.mockReset()
    checkRateLimitMock.mockReset().mockResolvedValue({ allowed: true })
    captureExceptionMock.mockReset()
  })

  it('returns a generic error instead of the raw error message on an unexpected failure', async () => {
    signUpMock.mockRejectedValue(new Error('connection timed out to mongodb+srv://user:pass@cluster/db'))

    const res = await POST(makeRequest(validPayload))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body).toEqual({ error: 'Failed to create account' })
  })
})
