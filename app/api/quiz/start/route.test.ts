import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "./route"

const createMock = vi.fn()
const fetchQuizQuestionsMock = vi.fn()
const getUserIdFromRequestMock = vi.fn()
const createAdvancedRandomizedQuestionsMock = vi.fn()
const generateSessionIdMock = vi.fn()

vi.mock("@/lib/mongoose", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/models/QuizAttempt", () => ({
  default: {
    create: (...args: unknown[]) => createMock(...args),
  },
}))

vi.mock("@/lib/jwt", () => ({
  getUserIdFromRequest: (...args: unknown[]) => getUserIdFromRequestMock(...args),
}))

vi.mock("@/lib/quiz/content", () => ({
  fetchQuizQuestions: (...args: unknown[]) => fetchQuizQuestionsMock(...args),
}))

vi.mock("@/lib/quiz/utils", () => ({
  createAdvancedRandomizedQuestions: (...args: unknown[]) =>
    createAdvancedRandomizedQuestionsMock(...args),
  generateSessionId: (...args: unknown[]) => generateSessionIdMock(...args),
}))

const sampleQuestions = [
  {
    id: 1,
    text: "Q1",
    options: [
      { id: 1, text: "A", archetype: "Avoider", points: 5 },
      { id: 2, text: "B", archetype: "Gambler", points: 4 },
    ],
  },
]

const shuffledLayout = [
  {
    id: 1,
    text: "Q1",
    options: [
      { id: 2, text: "B", archetype: "Gambler", points: 4 },
      { id: 1, text: "A", archetype: "Avoider", points: 5 },
    ],
  },
]

function makeRequest() {
  return new NextRequest("http://localhost/api/quiz/start", {
    method: "POST",
  })
}

describe("POST /api/quiz/start (WAS-107)", () => {
  beforeEach(() => {
    createMock.mockReset()
    fetchQuizQuestionsMock.mockReset()
    getUserIdFromRequestMock.mockReset()
    createAdvancedRandomizedQuestionsMock.mockReset()
    generateSessionIdMock.mockReset()

    getUserIdFromRequestMock.mockResolvedValue("507f1f77bcf86cd799439011")
    fetchQuizQuestionsMock.mockResolvedValue(sampleQuestions)
    createAdvancedRandomizedQuestionsMock.mockReturnValue(shuffledLayout)
    generateSessionIdMock.mockReturnValue("session-start-1")
    createMock.mockResolvedValue({ sessionId: "session-start-1" })
  })

  it("returns 401 when there is no authenticated user", async () => {
    getUserIdFromRequestMock.mockResolvedValue(null)

    const res = await POST(makeRequest())

    expect(res.status).toBe(401)
    expect(createMock).not.toHaveBeenCalled()
  })

  it("persists a shuffled layout and returns sessionId plus questions", async () => {
    const res = await POST(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.sessionId).toBe("session-start-1")
    expect(body.questions).toEqual(shuffledLayout)
    expect(createAdvancedRandomizedQuestionsMock).toHaveBeenCalledWith(
      sampleQuestions
    )
    expect(createMock).toHaveBeenCalledTimes(1)
    const [data] = createMock.mock.calls[0]
    expect(data.sessionId).toBe("session-start-1")
    expect(data.layout).toEqual(shuffledLayout)
    expect(data.status).toBe("in_progress")
    expect(data.expiresAt).toBeInstanceOf(Date)
  })

  it("returns 500 when question content is empty", async () => {
    fetchQuizQuestionsMock.mockResolvedValue([])

    const res = await POST(makeRequest())

    expect(res.status).toBe(500)
    expect(createMock).not.toHaveBeenCalled()
  })
})
