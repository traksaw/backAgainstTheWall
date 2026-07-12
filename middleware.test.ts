import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
