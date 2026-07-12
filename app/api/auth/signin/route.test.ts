import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const signInMock = vi.fn()
vi.mock('@/lib/auth', () => ({
  AuthService: {
    signIn: (...args: unknown[]) => signInMock(...args),
  },
}))

vi.mock('@/lib/jwt', () => ({
  signToken: vi.fn().mockReturnValue('signed-token'),
}))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeRawRequest(rawBody: string) {
  return new Request('http://localhost/api/auth/signin', {
    method: 'POST',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/signin (WAS-8: reject non-string bodies before they reach Mongoose)', () => {
  beforeEach(() => {
    signInMock.mockReset()
  })

  it('rejects a NoSQL-operator email payload with 400 instead of querying the database', async () => {
    const res = await POST(makeRequest({ email: { $ne: null }, password: { $ne: null } }))

    expect(res.status).toBe(400)
    expect(signInMock).not.toHaveBeenCalled()
  })

  it('rejects a non-email string', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email', password: 'x' }))

    expect(res.status).toBe(400)
    expect(signInMock).not.toHaveBeenCalled()
  })

  it('rejects a missing password', async () => {
    const res = await POST(makeRequest({ email: 'me@example.com' }))

    expect(res.status).toBe(400)
    expect(signInMock).not.toHaveBeenCalled()
  })

  it('rejects a non-JSON body with 400 instead of crashing', async () => {
    const res = await POST(makeRawRequest('not-json'))

    expect(res.status).toBe(400)
    expect(signInMock).not.toHaveBeenCalled()
  })

  it('signs in with a valid string email/password payload', async () => {
    signInMock.mockResolvedValue({
      _id: { toString: () => 'user-a' },
      email: 'me@example.com',
      first_name: 'A',
      last_name: 'B',
    })

    const res = await POST(makeRequest({ email: 'me@example.com', password: 'hunter2' }))

    expect(signInMock).toHaveBeenCalledWith('me@example.com', 'hunter2')
    expect(res.status).toBe(200)
    // A passing status with no session cookie is a broken login a client
    // can't detect - assert the actual side effect that makes sign-in useful.
    expect(res.cookies.get('token')?.value).toBe('signed-token')
  })
})
