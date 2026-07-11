import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const signUpMock = vi.fn()
vi.mock('@/lib/auth', () => ({
  AuthService: {
    signUp: (...args: unknown[]) => signUpMock(...args),
  },
}))

vi.mock('@/lib/jwt', () => ({
  signToken: vi.fn().mockReturnValue('signed-token'),
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
  password: 'hunter2',
  firstName: 'A',
  lastName: 'B',
  zip_code: '90210',
  occupationStatus: 'employed',
}

describe('POST /api/auth/signup (WAS-8: reject non-string bodies before they reach Mongoose)', () => {
  beforeEach(() => {
    signUpMock.mockReset()
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
  })
})
