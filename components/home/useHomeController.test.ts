// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useHomeController } from './useHomeController'

vi.mock('@/hooks/useQuiz', () => ({
  useQuiz: () => ({
    latestResult: null,
    loading: false,
    submitQuiz: vi.fn().mockResolvedValue({ _id: 'server-1', sessionId: 'session-1', archetype: 'Realist', score: 5, scores: { Avoider: 0, Gambler: 0, Realist: 5, Architect: 0 } }),
    updateQuizResult: vi.fn().mockResolvedValue({}),
  }),
}))

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

  it('startQuiz increments quizSession and opens the quiz modal after the buffer', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useHomeController())
    const sessionBefore = result.current.quizSession
    act(() => result.current.startQuiz())
    expect(result.current.showQuiz).toBe(false) // not yet — still buffering
    act(() => vi.advanceTimersByTime(60))
    expect(result.current.showQuiz).toBe(true)
    expect(result.current.quizSession).toBe(sessionBefore + 1)
    vi.useRealTimers()
  })
})
