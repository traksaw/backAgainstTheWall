import { describe, expect, it } from 'vitest'
import { generateToken, hashToken } from './tokens'

describe('generateToken', () => {
  it('returns a raw token and its sha256 hash', () => {
    const { token, tokenHash } = generateToken()

    expect(token).toBeTruthy()
    expect(tokenHash).toBeTruthy()
    expect(tokenHash).toBe(hashToken(token))
  })

  it('generates a different token on every call', () => {
    const a = generateToken()
    const b = generateToken()

    expect(a.token).not.toBe(b.token)
    expect(a.tokenHash).not.toBe(b.tokenHash)
  })

  it('hashToken is deterministic', () => {
    const { token } = generateToken()

    expect(hashToken(token)).toBe(hashToken(token))
  })

  it('the hash does not contain the raw token and is a sha256 hex digest', () => {
    const { token, tokenHash } = generateToken()

    expect(tokenHash).not.toContain(token)
    expect(tokenHash).toHaveLength(64)
  })
})
