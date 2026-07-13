import { describe, expect, it, vi } from 'vitest'
import type { Ratelimit } from '@upstash/ratelimit'
import * as Sentry from '@sentry/nextjs'

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

import { checkRateLimit, getClientIp } from './rate-limit'

function fakeLimiter(responses: Array<{ success: boolean; reset?: number } | Error>) {
  const limit = vi.fn()
  for (const response of responses) {
    if (response instanceof Error) {
      limit.mockImplementationOnce(() => Promise.reject(response))
    } else {
      limit.mockImplementationOnce(() =>
        Promise.resolve({ success: response.success, reset: response.reset ?? Date.now() + 5000 })
      )
    }
  }
  return { limit } as unknown as Ratelimit
}

describe('checkRateLimit', () => {
  it('allows the request when every key is under threshold', async () => {
    const limiter = fakeLimiter([{ success: true }, { success: true }])

    const result = await checkRateLimit(limiter, ['ip:1.2.3.4', 'email:me@example.com'])

    expect(result).toEqual({ allowed: true })
  })

  it('denies the request when a key is over threshold, with a positive retryAfterSeconds', async () => {
    const reset = Date.now() + 12_000
    const limiter = fakeLimiter([{ success: false, reset }])

    const result = await checkRateLimit(limiter, ['ip:1.2.3.4'])

    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.retryAfterSeconds).toBeGreaterThan(0)
      expect(result.retryAfterSeconds).toBeLessThanOrEqual(12)
    }
  })

  it('short-circuits on the first denied key without checking the rest', async () => {
    const limit = vi.fn().mockResolvedValueOnce({ success: false, reset: Date.now() + 1000 })
    const limiter = { limit } as unknown as Ratelimit

    await checkRateLimit(limiter, ['ip:1.2.3.4', 'email:me@example.com'])

    expect(limit).toHaveBeenCalledTimes(1)
  })

  it('fails open and reports to Sentry when the Redis call throws', async () => {
    const limiter = fakeLimiter([new Error('redis unreachable')])

    const result = await checkRateLimit(limiter, ['ip:1.2.3.4'])

    expect(result).toEqual({ allowed: true })
    expect(Sentry.captureException).toHaveBeenCalled()
  })
})

describe('getClientIp', () => {
  it('reads the first address from x-forwarded-for', () => {
    const req = new Request('http://localhost/api/auth/signin', {
      headers: { 'x-forwarded-for': '203.0.113.5, 70.41.3.18' },
    })

    expect(getClientIp(req)).toBe('203.0.113.5')
  })

  it('falls back to "unknown" when the header is absent', () => {
    const req = new Request('http://localhost/api/auth/signin')

    expect(getClientIp(req)).toBe('unknown')
  })
})
