import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { quizQuestions } from '@/lib/quiz/questions'

const createMock = vi.fn()

vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/models/QuizResult', () => ({
  default: {
    create: (...args: unknown[]) => createMock(...args),
  },
}))

const getUserIdFromRequestMock = vi.fn()
vi.mock('@/lib/jwt', () => ({
  getUserIdFromRequest: (...args: unknown[]) => getUserIdFromRequestMock(...args),
}))

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/quiz/submit', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeRawRequest(rawBody: string) {
  return new NextRequest('http://localhost/api/quiz/submit', {
    method: 'POST',
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  })
}

const validPayload = {
  answers: {
    0: { archetype: 'Architect', points: 3 },
  },
  sessionId: 'session-a',
  archetype: 'Architect',
  score: 3,
}

describe('POST /api/quiz/submit (WAS-8: reject malformed bodies before they reach Mongoose)', () => {
  beforeEach(() => {
    createMock.mockReset()
    getUserIdFromRequestMock.mockReset()
    getUserIdFromRequestMock.mockResolvedValue('507f1f77bcf86cd799439011')
  })

  it('returns 401 when there is no authenticated user', async () => {
    getUserIdFromRequestMock.mockResolvedValue(null)

    const res = await POST(makeRequest(validPayload))

    expect(res.status).toBe(401)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('rejects a payload missing answers', async () => {
    const { sessionId, archetype, score } = validPayload
    const res = await POST(makeRequest({ sessionId, archetype, score }))

    expect(res.status).toBe(400)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('rejects a non-JSON body with 400 instead of crashing', async () => {
    const res = await POST(makeRawRequest('not-json'))

    expect(res.status).toBe(400)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('creates a quiz result for a valid payload', async () => {
    createMock.mockResolvedValue({ _id: 'result-a', ...validPayload })

    const res = await POST(makeRequest(validPayload))

    expect(res.status).toBe(200)
    expect(createMock).toHaveBeenCalledTimes(1)
    const [data] = createMock.mock.calls[0]
    expect(data.archetype).toBe('Architect')
    expect(data.score).toBe(3)
  })
})

describe('POST /api/quiz/submit (WAS-89: recompute archetype/score server-side, never trust the client)', () => {
  beforeEach(() => {
    createMock.mockReset()
    getUserIdFromRequestMock.mockReset()
    getUserIdFromRequestMock.mockResolvedValue('507f1f77bcf86cd799439011')
  })

  it('ignores a client-supplied archetype/score that contradicts the answers and persists the recomputed result', async () => {
    createMock.mockResolvedValue({ _id: 'result-b' })

    const res = await POST(
      makeRequest({
        answers: {
          0: { archetype: 'Avoider', points: 5 },
        },
        sessionId: 'session-b',
        archetype: 'Architect',
        score: 999999,
      })
    )

    expect(res.status).toBe(200)
    expect(createMock).toHaveBeenCalledTimes(1)
    const [data] = createMock.mock.calls[0]
    expect(data.archetype).toBe('Avoider')
    expect(data.score).toBe(5)
  })

  it('rejects an answer with points outside the real quiz options range (1-5) instead of letting it inflate a score', async () => {
    const res = await POST(
      makeRequest({
        answers: {
          0: { archetype: 'Architect', points: 999999 },
        },
        sessionId: 'session-c',
      })
    )

    expect(res.status).toBe(400)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('rejects more answers than the quiz actually has questions instead of letting a flood inflate a score', async () => {
    const answers: Record<number, { archetype: string; points: number }> = {}
    for (let i = 0; i <= quizQuestions.length; i++) {
      answers[i] = { archetype: 'Architect', points: 4 }
    }

    const res = await POST(makeRequest({ answers, sessionId: 'session-d' }))

    expect(res.status).toBe(400)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('rejects an empty answers object with a 400 instead of a 500 from the scoring guard', async () => {
    const res = await POST(makeRequest({ answers: {}, sessionId: 'session-e' }))

    expect(res.status).toBe(400)
    expect(createMock).not.toHaveBeenCalled()
  })
})

describe('POST /api/quiz/submit (WAS-21: no PII in logs, no internal error detail in the response)', () => {
  beforeEach(() => {
    createMock.mockReset()
    getUserIdFromRequestMock.mockReset()
    getUserIdFromRequestMock.mockResolvedValue('507f1f77bcf86cd799439011')
  })

  it('returns a generic error and never leaks a Mongoose ValidationError payload to the client', async () => {
    const validationError = Object.assign(new Error('QuizResult validation failed: score: Path `score` is required.'), {
      name: 'ValidationError',
      errors: { score: { message: 'Path `score` is required.' } },
    })
    createMock.mockRejectedValue(validationError)

    const res = await POST(makeRequest(validPayload))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json).toEqual({ error: 'Failed to submit quiz' })
    expect(json.details).toBeUndefined()
    expect(json.validation).toBeUndefined()
  })

  it('returns a generic error without the raw error message for a plain failure', async () => {
    createMock.mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:27017'))

    const res = await POST(makeRequest(validPayload))
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json).toEqual({ error: 'Failed to submit quiz' })
  })

  it('does not console.log quiz answers or user data when NODE_ENV is production', async () => {
    const originalEnv = process.env.NODE_ENV
    vi.stubEnv('NODE_ENV', 'production')
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    createMock.mockResolvedValue({ _id: 'result-f', ...validPayload })

    try {
      const res = await POST(makeRequest(validPayload))
      expect(res.status).toBe(200)
      expect(logSpy).not.toHaveBeenCalled()
      expect(errorSpy).not.toHaveBeenCalled()
    } finally {
      logSpy.mockRestore()
      errorSpy.mockRestore()
      vi.stubEnv('NODE_ENV', originalEnv)
    }
  })
})
