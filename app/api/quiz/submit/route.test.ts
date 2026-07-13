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
})
