// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useHomeController } from './useHomeController'
import { useQuiz } from '@/hooks/useQuiz'
import type { QuizAnswer, QuizResult, QuizSubmissionData } from '@/types/quiz'

// The plan's literal mock is a static factory: `latestResult` is always `null` and
// `submitQuiz` always resolves to a hardcoded `sessionId: 'session-1'`. That's fine for
// most tests (and matches the plan's Task 3/4 mock verbatim), but it can never satisfy
// the "prefers the server-confirmed result" test below: the optimistic sessionId comes
// from quizLogic.processQuizCompletion()'s real generateSessionId() (timestamp +
// Math.random — see lib/quiz/utils.ts), which will never equal the literal string
// 'session-1'. So that one test gets its own stateful override (see below) that echoes
// back whatever sessionId/archetype/scores were actually submitted, letting it exercise
// the real reconciliation-by-sessionId path. Every other test keeps the plan's original
// static mock, reset via beforeEach.
vi.mock('@/hooks/useQuiz', () => ({
  useQuiz: vi.fn(),
}))

const mockedUseQuiz = vi.mocked(useQuiz)

function defaultUseQuizMock() {
  return {
    quizResults: [],
    latestResult: null,
    loading: false,
    submitQuiz: vi.fn().mockResolvedValue({ _id: 'server-1', sessionId: 'session-1', archetype: 'Realist', score: 5, scores: { Avoider: 0, Gambler: 0, Realist: 5, Architect: 0 } }),
    updateQuizResult: vi.fn().mockResolvedValue({}),
    refreshResults: vi.fn().mockResolvedValue(undefined),
  }
}

beforeEach(() => {
  mockedUseQuiz.mockReset()
  mockedUseQuiz.mockImplementation(defaultUseQuizMock)
})

function answer(archetype: QuizAnswer['archetype'], points: number, text = 'answer'): QuizAnswer {
  return { text, archetype, points }
}

describe('useHomeController modal/session state', () => {
  it('starts with every modal closed', () => {
    const { result } = renderHook(() => useHomeController())
    expect(result.current.showSignup).toBe(false)
    expect(result.current.showQuiz).toBe(false)
  })

  it('openSignup opens signup and closes everything else', () => {
    const { result } = renderHook(() => useHomeController())
    act(() => result.current.openSignup())
    expect(result.current.showSignup).toBe(true)
    expect(result.current.showSignin).toBe(false)
  })

  it('switchToSignIn swaps signup for signin without a buffer', () => {
    const { result } = renderHook(() => useHomeController())
    act(() => result.current.openSignup())
    act(() => result.current.switchToSignIn())
    expect(result.current.showSignup).toBe(false)
    expect(result.current.showSignin).toBe(true)
  })

  describe('with fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('startQuiz increments quizSession and opens the quiz modal after the buffer', async () => {
      const { result } = renderHook(() => useHomeController())
      const sessionBefore = result.current.quizSession
      act(() => result.current.startQuiz())
      expect(result.current.showQuiz).toBe(false) // not yet — still buffering
      act(() => vi.advanceTimersByTime(60))
      expect(result.current.showQuiz).toBe(true)
      expect(result.current.quizSession).toBe(sessionBefore + 1)
    })
  })
})

describe('useHomeController quiz completion', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('computes the REAL archetype/scores optimistically instead of a hardcoded placeholder', async () => {
    const { result } = renderHook(() => useHomeController())

    await act(async () => {
      await result.current.completeQuiz({
        1: answer('Architect', 5),
        2: answer('Architect', 4),
        3: answer('Gambler', 1),
      })
    })

    // Regression guard: this must NOT be the old hardcoded 'Realist'/zero-scores bug.
    expect(result.current.latestResult?.archetype).toBe('Architect')
    expect(result.current.latestResult?.scores.Architect).toBe(9)

    act(() => vi.advanceTimersByTime(300))
    expect(result.current.showResults).toBe(true)
  })

  it('prefers the server-confirmed result once its sessionId matches the optimistic one, without dropping scores the API never echoes back', async () => {
    // Stateful override, scoped to this test only (see the top-of-file comment): mirrors
    // real useQuiz by holding latestResult in React state and updating it once submitQuiz
    // resolves, echoing back the sessionId it was actually called with.
    //
    // Realistic response shape: none of app/api/quiz/{submit,[id]/update,results} ever
    // return a top-level `scores` field (models/QuizResult.ts's schema has no such field —
    // only a differently-shaped, internal `answers.scores`). So this mock intentionally
    // omits it, the way the real API does, to catch a regression where reconciliation
    // would otherwise silently blank out the scores computed optimistically on the client
    // (which is exactly the second flash-bug a prior review caught in this same code path).
    mockedUseQuiz.mockImplementation(() => {
      const [latestResult, setLatestResult] = useState<QuizResult | null>(null)
      const submitQuiz = vi.fn(async (quizData: QuizSubmissionData): Promise<QuizResult> => {
        const serverResult = {
          _id: 'server-1',
          sessionId: quizData.sessionId,
          archetype: quizData.archetype,
          score: quizData.score,
          // no `scores`, no `answers` — matches the real API's response shape
        } as unknown as QuizResult
        setLatestResult(serverResult)
        return serverResult
      })
      return {
        quizResults: [],
        latestResult,
        loading: false,
        submitQuiz,
        updateQuizResult: vi.fn().mockResolvedValue({}),
        refreshResults: vi.fn().mockResolvedValue(undefined),
      }
    })

    const { result } = renderHook(() => useHomeController())

    await act(async () => {
      await result.current.completeQuiz({ 1: answer('Realist', 5) })
    })

    // Server result wins for the fields it does confirm (real `_id`)...
    expect(result.current.latestResult?._id).toBeDefined()
    // ...but the optimistically-computed scores must survive the reconciliation, since the
    // server response never carried its own top-level `scores` to overwrite them with.
    expect(result.current.latestResult?.scores?.Realist).toBe(5)
  })

  it('retakeQuiz clears the previous optimistic result so a stale one cannot leak into the new attempt', async () => {
    const { result } = renderHook(() => useHomeController())

    await act(async () => {
      await result.current.completeQuiz({ 1: answer('Realist', 5) })
    })
    expect(result.current.latestResult).not.toBeNull()

    act(() => result.current.retakeQuiz())
    expect(result.current.latestResult).toBeNull()
  })
})
