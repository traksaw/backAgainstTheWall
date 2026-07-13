import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from './middleware'

const ORIGINAL_USER = process.env.SANITY_STUDIO_USERNAME
const ORIGINAL_PASS = process.env.SANITY_STUDIO_PASSWORD

function basicAuthHeader(user: string, pass: string) {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`
}

function requestWithAuth(authHeader?: string) {
  return new NextRequest('http://localhost/sanity-studio', {
    headers: authHeader ? { authorization: authHeader } : {},
  })
}

describe('middleware (WAS-17: gate the exposed Sanity Studio route)', () => {
  beforeEach(() => {
    process.env.SANITY_STUDIO_USERNAME = 'editor'
    process.env.SANITY_STUDIO_PASSWORD = 'super-secret'
  })

  afterEach(() => {
    process.env.SANITY_STUDIO_USERNAME = ORIGINAL_USER
    process.env.SANITY_STUDIO_PASSWORD = ORIGINAL_PASS
  })

  it('returns 401 with no Authorization header at all', () => {
    const res = middleware(requestWithAuth())

    expect(res.status).toBe(401)
    expect(res.headers.get('WWW-Authenticate')).toContain('Basic')
  })

  it('returns 401 for a non-Basic Authorization header', () => {
    const res = middleware(requestWithAuth('Bearer some-token'))

    expect(res.status).toBe(401)
  })

  it('returns 401 for the wrong username or password', () => {
    const res = middleware(requestWithAuth(basicAuthHeader('editor', 'wrong-password')))

    expect(res.status).toBe(401)
  })

  it('returns 401 when the guessed password is a different length than the real one', () => {
    // Regression check for the timing-safe comparison: a naive `!==` still
    // works here, but a length-sensitive compare (e.g. raw timingSafeEqual
    // without hashing first) would throw instead of rejecting cleanly.
    const res = middleware(requestWithAuth(basicAuthHeader('editor', 'x')))

    expect(res.status).toBe(401)
  })

  it('fails closed (500), not open, if the gate is unconfigured', () => {
    delete process.env.SANITY_STUDIO_USERNAME
    delete process.env.SANITY_STUDIO_PASSWORD

    const res = middleware(requestWithAuth(basicAuthHeader('editor', 'super-secret')))

    expect(res.status).toBe(500)
  })

  it('allows the request through for the correct credentials', () => {
    const res = middleware(requestWithAuth(basicAuthHeader('editor', 'super-secret')))

    // NextResponse.next() carries no explicit status override - 200 is the
    // "let it through" signal from this middleware.
    expect(res.status).toBe(200)
  })
})

describe('middleware CSP script-src (WAS-33/WAS-24: dev-mode eval carve-out)', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV

  afterEach(() => {
    vi.stubEnv('NODE_ENV', ORIGINAL_NODE_ENV ?? 'test')
  })

  function cspFor(nodeEnv: string) {
    vi.stubEnv('NODE_ENV', nodeEnv)
    const res = middleware(new NextRequest('http://localhost/'))
    return res.headers.get('Content-Security-Policy') ?? ''
  }

  it('omits unsafe-eval in a production build, so the deployed policy stays strict', () => {
    expect(cspFor('production')).not.toContain('unsafe-eval')
  })

  it('adds unsafe-eval outside production, so next dev\'s React Refresh runtime can hydrate', () => {
    expect(cspFor('development')).toContain('unsafe-eval')
  })

  it('keeps nonce and strict-dynamic in both modes', () => {
    for (const env of ['production', 'development']) {
      const csp = cspFor(env)
      expect(csp).toMatch(/'nonce-[^']+'/)
      expect(csp).toContain('strict-dynamic')
    }
  })
})
