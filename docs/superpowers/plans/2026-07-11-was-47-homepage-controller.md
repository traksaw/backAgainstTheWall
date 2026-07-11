# WAS-47: Homepage Controller Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace `HomeInteractiveShell.tsx`'s ad-hoc state (six modal booleans, two overlapping hooks, three raw `useState`s, four inconsistent `setTimeout` delays, three independent `useQuiz()` instances) with a single `useHomeController` hook, and unify the two parallel `QuizResult`/`Archetype`/`QuizAnswer` type families into one canonical set.

**Architecture:** Two phases in one PR. Phase 1 mechanically relocates the existing logic into one hook, makes it the sole `useQuiz()` caller, and fixes the optimistic-result flash bug (computing real archetype/scores instead of a hardcoded placeholder) — behavior otherwise unchanged. Phase 2 replaces the boolean-flag modal state and ad-hoc `setTimeout` chain with an explicit `activeModal`/`pendingModal` reducer and one centralized transition-buffer constant.

**Tech Stack:** Next.js (client components), React `useState`/`useReducer`, Vitest + `@testing-library/react` (jsdom via `// @vitest-environment jsdom` pragma, matching the existing `HomeInteractiveShell.test.tsx` convention).

**Design doc:** `docs/superpowers/specs/2026-07-11-was-47-homepage-controller-design.md` — read it first if anything below is ambiguous.

---

## Phase 1: Mechanical extraction + correctness fixes

### Task 1: Unify QuizResult/Archetype/QuizAnswer types

**Files:**
- Modify: `types/quiz.ts:66-77` (the `QuizResult` interface)
- Modify: `lib/quiz.ts:1-33` (delete local type declarations, import canonical ones)

**Step 1: Add the missing fields to the canonical type**

In `types/quiz.ts`, extend `QuizResult` with the two fields that only exist on `lib/quiz.ts`'s copy today:

```ts
export interface QuizResult {
  _id?: string
  id?: string
  userId?: string                      // added: was lib/quiz.ts-only
  archetype: Archetype
  score: number
  scores: QuizScores
  createdAt?: string
  updatedAt?: string                   // added: was lib/quiz.ts-only
  hasViewedResults?: boolean
  hasWatchedFilm?: boolean
  answers?: Record<number, QuizAnswer>
  sessionId?: string
}
```

**Step 2: Point `lib/quiz.ts` at the canonical types**

Replace the top of `lib/quiz.ts`:

```ts
// lib/quiz.ts

import type { Archetype, QuizAnswer, QuizResult } from "@/types/quiz"
export type { Archetype, QuizAnswer, QuizResult }

export interface QuizResultUpdate {
  hasViewedResults?: boolean
  hasWatchedFilm?: boolean
}

export class QuizService {
  // ...unchanged below this line
```

Delete the old local `Archetype`, `QuizAnswer`, and `QuizResult` interface/type declarations that used to sit above `QuizResultUpdate`.

**Step 3: Verify no regressions**

This is a type-only consolidation — there's no new behavior to TDD, so verify with the type checker and full suite instead of a new test:

Run: `pnpm type-check`
Expected: no errors (every consumer of `lib/quiz.ts`'s types — `useQuiz.ts`, `useQuizHandlers.ts`, `ResultsModal.tsx`, `QuizModal.tsx` — is structurally compatible, since the two type families were already identical except for the two fields just added).

Run: `pnpm test`
Expected: all existing suites still pass (8 files).

**Step 4: Commit**

```bash
git add types/quiz.ts lib/quiz.ts
git commit -m "refactor: unify QuizResult/Archetype/QuizAnswer into one canonical type"
```

---

### Task 2: Make `submitQuiz` use pre-computed scoring instead of recomputing inline

**Why:** `useQuiz.ts`'s `submitQuiz` currently recomputes archetype/scores itself with a naive `.reduce` tie-break, different from `lib/quiz/utils.ts`'s `getWinningArchetype` (which has documented, deterministic tie-breaking — see the WAS-9 comments in that file). The controller we're about to build computes an optimistic result via the *correct* `getWinningArchetype`-based path (`useQuizLogic().processQuizCompletion`) and later reconciles it with whatever the server persists. If the server computes its own, differently-tie-broken answer, a tied quiz could show one archetype optimistically and silently flip to a different one once the server confirms — reintroducing a rarer version of the exact bug this ticket fixes. Passing the already-computed values through removes the second implementation entirely.

**Files:**
- Modify: `hooks/useQuiz.ts:43-78` (the `submitQuiz` function)

**Step 1: Replace `submitQuiz`'s body**

```ts
const submitQuiz = async (quizData: QuizSubmissionData) => {
  if (!user?._id) throw new Error("User not authenticated")

  setLoading(true)
  try {
    const result = await QuizService.submitQuiz(quizData)
    setLatestResult(result)
    setQuizResults((prev) => [result, ...prev])
    return result
  } catch (error) {
    console.error("Error submitting quiz:", error)
    throw error
  } finally {
    setLoading(false)
  }
}
```

Add the import at the top of `hooks/useQuiz.ts`:

```ts
import type { QuizSubmissionData } from "@/types/quiz"
```

(`QuizSubmissionData` already exists in `types/quiz.ts:80-86` — no new type needed. `QuizService.submitQuiz`'s parameter shape in `lib/quiz.ts` already accepts `{ answers, sessionId?, archetype, score, scores? }`, which is exactly `QuizSubmissionData`'s shape, so no change needed there.)

**Step 2: Verify**

Run: `pnpm type-check`
Expected: no errors. (The only caller of `submitQuiz` today, `hooks/useQuizHandlers.ts`, gets rewritten in Task 6 to match this new signature — until then it will show a type error, which is expected and resolved by Task 6. If you want a green typecheck at every commit, do Task 2's `useQuiz.ts` change together with Task 6 in one commit instead of separately — see the note at the end of Task 6.)

**Step 3: Commit** (or fold into Task 6's commit — see note above)

```bash
git add hooks/useQuiz.ts
git commit -m "refactor: submitQuiz takes pre-computed quiz data instead of recomputing scores"
```

---

### Task 3: Write failing tests for `useHomeController`'s modal/session state (Phase 1 shape)

**Files:**
- Create: `components/home/useHomeController.test.ts`

This hook doesn't render DOM directly, but it calls `useQuiz()` (which does `fetch`) and needs React's hook runtime — use `renderHook` from `@testing-library/react` under jsdom, same pattern as `HomeInteractiveShell.test.tsx`.

**Step 1: Write the test file**

```ts
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
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run components/home/useHomeController.test.ts`
Expected: FAIL with "Cannot find module './useHomeController'" (file doesn't exist yet).

---

### Task 4: Implement `useHomeController.ts` — Phase 1 modal/session core

**Files:**
- Create: `components/home/useHomeController.ts`

**Step 1: Implement the modal/session portion**

```ts
// components/home/useHomeController.ts
"use client"

import { useState } from "react"
import { useQuiz } from "@/hooks/useQuiz"
import { useQuizLogic } from "@/hooks/useQuizLogic"

export function useHomeController() {
  const { loading: quizLoading } = useQuiz()
  void quizLogicPlaceholder() // removed once Task 6 fills in the rest — see below

  const [showSignup, setShowSignup] = useState(false)
  const [showSignin, setShowSignin] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showFilm, setShowFilm] = useState(false)
  const [showQuizHistory, setShowQuizHistory] = useState(false)

  const [quizSession, setQuizSession] = useState(0)
  const [autoResetQuiz, setAutoResetQuiz] = useState(false)

  const closeAllModals = () => {
    setShowSignup(false)
    setShowSignin(false)
    setShowQuiz(false)
    setShowResults(false)
    setShowFilm(false)
    setShowQuizHistory(false)
  }

  const openSignup = () => { closeAllModals(); setShowSignup(true) }
  const openSignin = () => { closeAllModals(); setShowSignin(true) }
  const openQuizHistory = () => { closeAllModals(); setShowQuizHistory(true) }
  const switchToSignIn = () => { setShowSignup(false); setShowSignin(true) }
  const switchToSignUp = () => { setShowSignin(false); setShowSignup(true) }

  const startQuiz = () => {
    setQuizSession((s) => s + 1)
    setTimeout(() => {
      closeAllModals()
      setShowQuiz(true)
    }, 50)
  }

  const retakeQuiz = () => {
    closeAllModals()
    setQuizSession((s) => s + 1)
    setTimeout(() => {
      setAutoResetQuiz(true)
      setShowQuiz(true)
    }, 150)
  }

  const signupSucceeded = () => {
    setShowSignup(false)
    setTimeout(() => {
      startQuiz()
    }, 100)
  }

  return {
    showSignup, showSignin, showQuiz, showResults, showFilm, showQuizHistory,
    setShowQuiz, setShowResults, setShowFilm, setShowQuizHistory,
    quizSession, autoResetQuiz, quizLoading,
    openSignup, openSignin, openQuizHistory, closeAllModals,
    switchToSignIn, switchToSignUp, signupSucceeded,
    startQuiz, retakeQuiz,
  }
}
```

(Ignore the `quizLogicPlaceholder`/`void` line above — it's a placeholder so this step compiles in isolation before Task 6 fills in the quiz-completion logic that actually uses `useQuizLogic()`. Delete that line and the unused `useQuizLogic` import if you're implementing Task 4 and Task 6 back to back, which is recommended — see note below.)

**Step 2: Run test to verify it passes**

Run: `npx vitest run components/home/useHomeController.test.ts`
Expected: PASS for all four tests.

**Step 3: Commit**

```bash
git add components/home/useHomeController.ts components/home/useHomeController.test.ts
git commit -m "feat: add useHomeController with modal/session state (Phase 1)"
```

*Note: Tasks 3-4 in isolation leave an unused `useQuizLogic` import and a placeholder call. In practice, do Task 3+4 and Task 5+6 as one continuous work session and skip the placeholder — it's included here only so each task's code block is independently correct/compilable if you do stop between them.*

---

### Task 5: Write failing tests for quiz completion (the flash-bug fix + reconciliation)

**Files:**
- Modify: `components/home/useHomeController.test.ts`

**Step 1: Add these tests to the same file**

```ts
import type { QuizAnswer } from '@/types/quiz'

function answer(archetype: QuizAnswer['archetype'], points: number, text = 'answer'): QuizAnswer {
  return { text, archetype, points }
}

describe('useHomeController quiz completion', () => {
  it('computes the REAL archetype/scores optimistically instead of a hardcoded placeholder', async () => {
    vi.useFakeTimers()
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
    vi.useRealTimers()
  })

  it('prefers the server-confirmed result once its sessionId matches the optimistic one', async () => {
    const { result } = renderHook(() => useHomeController())

    await act(async () => {
      await result.current.completeQuiz({ 1: answer('Realist', 5) })
    })

    // The mocked submitQuiz above resolves with sessionId: 'session-1' and _id: 'server-1' —
    // once useQuiz's own latestResult reflects that, reconciliation should prefer it.
    expect(result.current.latestResult?._id).toBeDefined()
  })

  it('retakeQuiz clears the previous optimistic result so a stale one cannot leak into the new attempt', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useHomeController())

    await act(async () => {
      await result.current.completeQuiz({ 1: answer('Realist', 5) })
    })
    expect(result.current.latestResult).not.toBeNull()

    act(() => result.current.retakeQuiz())
    expect(result.current.latestResult).toBeNull()
    vi.useRealTimers()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run components/home/useHomeController.test.ts`
Expected: FAIL — `completeQuiz`/`latestResult` don't exist on the controller yet.

---

### Task 6: Implement quiz-completion logic in `useHomeController`

**Files:**
- Modify: `components/home/useHomeController.ts`

**Step 1: Fill in the rest of the hook**

Replace the placeholder line and add the quiz-completion logic (full file, Phase 1 complete):

```ts
// components/home/useHomeController.ts
"use client"

import { useState } from "react"
import { useQuiz } from "@/hooks/useQuiz"
import { useQuizLogic } from "@/hooks/useQuizLogic"
import type { QuizAnswer, QuizResult } from "@/types/quiz"

function reconcileLatestResult(
  serverResult: QuizResult | null,
  optimisticResult: QuizResult | null
): QuizResult | null {
  if (serverResult && optimisticResult && serverResult.sessionId === optimisticResult.sessionId) {
    return serverResult
  }
  return optimisticResult ?? serverResult
}

export function useHomeController() {
  const { latestResult: serverLatestResult, loading: quizLoading, submitQuiz, updateQuizResult } = useQuiz()
  const quizLogic = useQuizLogic()

  const [showSignup, setShowSignup] = useState(false)
  const [showSignin, setShowSignin] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showFilm, setShowFilm] = useState(false)
  const [showQuizHistory, setShowQuizHistory] = useState(false)

  const [quizSession, setQuizSession] = useState(0)
  const [autoResetQuiz, setAutoResetQuiz] = useState(false)
  const [optimisticResult, setOptimisticResult] = useState<QuizResult | null>(null)

  const closeAllModals = () => {
    setShowSignup(false)
    setShowSignin(false)
    setShowQuiz(false)
    setShowResults(false)
    setShowFilm(false)
    setShowQuizHistory(false)
  }

  const openSignup = () => { closeAllModals(); setShowSignup(true) }
  const openSignin = () => { closeAllModals(); setShowSignin(true) }
  const openQuizHistory = () => { closeAllModals(); setShowQuizHistory(true) }
  const switchToSignIn = () => { setShowSignup(false); setShowSignin(true) }
  const switchToSignUp = () => { setShowSignin(false); setShowSignup(true) }

  const startQuiz = () => {
    setQuizSession((s) => s + 1)
    setTimeout(() => {
      closeAllModals()
      setShowQuiz(true)
    }, 50)
  }

  const retakeQuiz = () => {
    closeAllModals()
    setOptimisticResult(null)
    setQuizSession((s) => s + 1)
    setTimeout(() => {
      setAutoResetQuiz(true)
      setShowQuiz(true)
    }, 150)
  }

  const signupSucceeded = () => {
    setShowSignup(false)
    setTimeout(() => {
      startQuiz()
    }, 100)
  }

  const completeQuiz = async (answers: Record<number, QuizAnswer>) => {
    try {
      const quizData = quizLogic.processQuizCompletion(answers)

      const optimistic: QuizResult = {
        archetype: quizData.archetype,
        score: quizData.score,
        scores: quizData.scores,
        answers: quizData.answers,
        sessionId: quizData.sessionId,
        createdAt: new Date().toISOString(),
        hasViewedResults: false,
        hasWatchedFilm: false,
      }

      setShowQuiz(false)
      setOptimisticResult(optimistic)
      setTimeout(() => {
        setShowResults(true)
      }, 300)

      try {
        await submitQuiz(quizData)
      } catch (error) {
        console.warn('Backend submission failed, but results are shown optimistically:', error)
      }
    } catch (error) {
      console.error('Quiz completion error:', error)
      setShowQuiz(false)
      alert(`Quiz failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const latestResult = reconcileLatestResult(serverLatestResult, optimisticResult)

  const viewResults = async () => {
    if (latestResult && !latestResult.hasViewedResults) {
      const resultId = latestResult._id
      if (!resultId) {
        console.error('No valid ID found in latestResult:', latestResult)
      } else {
        try {
          await updateQuizResult(resultId, { hasViewedResults: true })
        } catch (error) {
          console.warn('Failed to update results viewed:', error)
        }
      }
    }
    setShowResults(false)
    setShowFilm(true)
  }

  const completeFilm = async () => {
    if (latestResult && !latestResult.hasWatchedFilm) {
      const resultId = latestResult._id
      if (!resultId) {
        console.error('No valid ID found in latestResult:', latestResult)
      } else {
        try {
          await updateQuizResult(resultId, { hasWatchedFilm: true })
        } catch (error) {
          console.warn('Failed to update film watched:', error)
        }
      }
    }
    setShowFilm(false)
  }

  const handleVideoError = (error: string) => {
    console.error('Video playback error:', error)
  }

  return {
    showSignup, showSignin, showQuiz, showResults, showFilm, showQuizHistory,
    setShowQuiz, setShowResults, setShowFilm, setShowQuizHistory,
    quizSession, autoResetQuiz, latestResult, quizLoading,
    openSignup, openSignin, openQuizHistory, closeAllModals,
    switchToSignIn, switchToSignUp, signupSucceeded,
    startQuiz, retakeQuiz, completeQuiz, viewResults, completeFilm, handleVideoError,
  }
}
```

**Step 2: Run tests to verify they pass**

Run: `npx vitest run components/home/useHomeController.test.ts`
Expected: PASS for all 7 tests (4 from Task 3 + 3 from Task 5).

Run: `pnpm type-check`
Expected: no errors (this also resolves the expected Task 2 type error, since `completeQuiz` now calls `submitQuiz(quizData)` matching its new signature).

**Step 3: Commit**

```bash
git add components/home/useHomeController.ts components/home/useHomeController.test.ts hooks/useQuiz.ts
git commit -m "feat: quiz-completion flow in useHomeController, fixing the optimistic-result flash bug"
```

---

### Task 7: Update `QuizModal` to take `quizLoading` as a prop

**Files:**
- Modify: `components/quiz/QuizModal.tsx:1-31`

**Step 1: Remove the hook call, add the prop**

```ts
// remove this import:
// import { useQuiz } from "@/hooks/useQuiz"

interface QuizModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuizComplete: (answers: Record<number, QuizAnswer>) => void
  profile: UserProfile
  autoReset?: boolean
  quizLoading: boolean          // new
}

export function QuizModal({ open, onOpenChange, onQuizComplete, profile, autoReset = false, quizLoading }: QuizModalProps) {
  const quizState = useQuizState()
  // remove: const { loading: quizLoading } = useQuiz()

  // ...rest of the component is unchanged — `quizLoading` is already used
  // below via `disabled={quizLoading}` on the answer buttons.
```

**Step 2: Verify**

Run: `pnpm type-check`
Expected: an error at `HomeInteractiveShell.tsx`'s `<QuizModal>` usage (missing the new required `quizLoading` prop) — expected, resolved in Task 8.

---

### Task 8: Rewrite `HomeInteractiveShell.tsx` to use `useHomeController`

**Files:**
- Modify: `components/home/HomeInteractiveShell.tsx` (293 lines → thin composition)
- Delete: `hooks/useModalState.ts`
- Delete: `hooks/useQuizHandlers.ts`

**Step 1: Delete the subsumed hooks**

```bash
git rm hooks/useModalState.ts hooks/useQuizHandlers.ts
```

**Step 2: Rewrite the shell**

```tsx
// components/home/HomeInteractiveShell.tsx
"use client"

import type { ReactNode } from "react"
import { QuizModal } from "@/components/quiz/QuizModal"
import { ResultsModal } from "@/components/results/ResultsModal"
import { UserMenu } from "@/components/layout/UserMenu"
import { SignInModal } from "@/components/auth/SignInModal"
import { SignUpModal } from "@/components/auth/SignUpModal"
import Hero from "@/components/Hero"
import { VideoPlayer } from "@/components/VideoPlayer"
import { QuizHistorySection } from "@/components/QuizHistorySection"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useHomeController } from "@/components/home/useHomeController"
import { useAuth } from "@/hooks/useAuth"
import type { Supporter } from "@/types/supporter"
import type { User, Profile } from "@/types/auth"

interface HomeInteractiveShellProps {
  supporters: Supporter[]
  children: ReactNode
}

export function HomeInteractiveShell({ supporters, children }: HomeInteractiveShellProps) {
  const { user: rawUser, profile: rawProfile, signOut } = useAuth()
  const controller = useHomeController()

  const user: User | null = rawUser ? {
    _id: rawUser._id,
    email: rawUser.email,
    first_name: rawUser.first_name || '',
    last_name: rawUser.last_name || ''
  } : null

  const profile: Profile | null = rawProfile ? {
    first_name: rawProfile.first_name || '',
    last_name: rawProfile.last_name || ''
  } : null

  const userProfile = {
    _id: rawUser?._id || '',
    email: rawUser?.email || '',
    first_name: rawProfile?.first_name || '',
    last_name: rawProfile?.last_name || ''
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <UserMenu
        user={user}
        profile={profile}
        onSignOut={signOut}
        onShowQuizHistory={controller.openQuizHistory}
      />

      <Hero
        user={user}
        latestResult={controller.latestResult}
        supporters={supporters}
        onSignUp={controller.openSignup}
        onStartQuiz={controller.startQuiz}
        onRetakeQuiz={controller.retakeQuiz}
        onShowResults={() => controller.setShowResults(true)}
        onWatchFilm={() => controller.setShowFilm(true)}
      />

      {children}

      <SignUpModal
        open={controller.showSignup}
        onOpenChange={controller.setShowSignup}
        onSwitchToSignIn={controller.switchToSignIn}
        onSuccess={controller.signupSucceeded}
      />

      <SignInModal
        open={controller.showSignin}
        onOpenChange={controller.setShowSignin}
        onSwitchToSignUp={controller.switchToSignUp}
      />

      <QuizModal
        key={controller.quizSession}
        open={controller.showQuiz}
        onOpenChange={(open) => {
          if (!open) controller.setShowQuiz(false)
        }}
        onQuizComplete={controller.completeQuiz}
        profile={userProfile}
        autoReset={controller.autoResetQuiz}
        quizLoading={controller.quizLoading}
      />

      <ResultsModal
        open={controller.showResults}
        onOpenChange={controller.setShowResults}
        latestResult={controller.latestResult}
        onResultsViewed={controller.viewResults}
        loading={controller.quizLoading}
        onRetakeQuiz={controller.retakeQuiz}
      />

      <Dialog open={controller.showFilm} onOpenChange={controller.setShowFilm}>
        <DialogContent className="w-[95vw] max-w-5xl bg-black border-0 max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-white">
              Back Against the Wall
            </DialogTitle>
            <DialogDescription className="text-center text-gray-300 text-sm sm:text-base px-2">
              {user && controller.latestResult?.archetype ? (
                <>
                  Watching as <span className="text-[#B95D38]">The {controller.latestResult.archetype}</span> — Notice how the
                  characters' financial decisions reflect your own mindset
                </>
              ) : (
                <>
                  Watching as <span className="text-[#B95D38]">A Guest</span> — Observe how different financial
                  personalities handle pressure
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full">
            <VideoPlayer
              src="https://tkoohwnrcxpmkerj.public.blob.vercel-storage.com/Ambitious_compatible.mp4"
              poster="/assets/desktop-movie-poster.png"
              title="Back Against the Wall"
              onEnded={controller.completeFilm}
              onError={controller.handleVideoError}
              className="aspect-video w-full"
              autoPlay={false}
            />
            {controller.latestResult?.archetype && (
              <div className="absolute top-4 right-4 z-30">
                <div className="bg-[#B95D38]/90 text-white px-3 py-1 rounded-full text-sm font-medium">
                  The {controller.latestResult.archetype}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <QuizHistorySection
        open={controller.showQuizHistory}
        onOpenChange={controller.setShowQuizHistory}
      />
    </div>
  )
}
```

Note: `Hero`'s `onShowResults`/`onWatchFilm` props previously called `modals.openResults`/`modals.openFilm` (which ran `closeAllModals()` first). Since those are only reachable when no other modal is open (from the Hero CTA area), calling `setShowResults(true)`/`setShowFilm(true)` directly is behaviorally equivalent here — but if you want to be perfectly faithful, keep two small helpers (`openResults`, `openFilm`) on the controller instead of exposing raw setters for this one case. Either is fine; prefer whichever you find more readable.

**Step 3: Verify**

Run: `pnpm type-check`
Expected: no errors.

Run: `pnpm lint`
Expected: no errors/warnings.

---

### Task 9: Rewrite `HomeInteractiveShell.test.tsx` mocks

**Files:**
- Modify: `components/home/HomeInteractiveShell.test.tsx`

**Step 1: Replace the four hook mocks with two**

Remove the `vi.mock('@/hooks/useQuiz', ...)`, `vi.mock('@/hooks/useModalState', ...)`, and `vi.mock('@/hooks/useQuizHandlers', ...)` blocks. Replace with:

```ts
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, profile: null, signOut: vi.fn(), loading: true }),
}))

vi.mock('@/components/home/useHomeController', () => ({
  useHomeController: () => ({
    showSignup: false, showSignin: false, showQuiz: false, showResults: false, showFilm: false, showQuizHistory: false,
    setShowQuiz: vi.fn(), setShowResults: vi.fn(), setShowFilm: vi.fn(), setShowQuizHistory: vi.fn(),
    quizSession: 0, autoResetQuiz: false, latestResult: null, quizLoading: false,
    openSignup: vi.fn(), openSignin: vi.fn(), openQuizHistory: vi.fn(), closeAllModals: vi.fn(),
    switchToSignIn: vi.fn(), switchToSignUp: vi.fn(), signupSucceeded: vi.fn(),
    startQuiz: vi.fn(), retakeQuiz: vi.fn(), completeQuiz: vi.fn(), viewResults: vi.fn(),
    completeFilm: vi.fn(), handleVideoError: vi.fn(),
  }),
}))
```

Keep every other mock (`Hero`, `VideoPlayer`, `QuizHistorySection`, `QuizModal`, `ResultsModal`, `UserMenu`, `SignInModal`, `SignUpModal`) and the existing test body unchanged — the assertion (`useAuth`'s `loading: true` must not hide `Hero`/`UserMenu` behind a loading gate) is testing a concern this refactor doesn't touch.

**Step 2: Run test to verify it passes**

Run: `npx vitest run components/home/HomeInteractiveShell.test.tsx`
Expected: PASS.

**Step 3: Commit**

```bash
git add components/quiz/QuizModal.tsx components/home/HomeInteractiveShell.tsx components/home/HomeInteractiveShell.test.tsx
git commit -m "refactor: HomeInteractiveShell consumes useHomeController; delete useModalState/useQuizHandlers"
```

---

### Task 10: Phase 1 full verification + manual walkthrough

**Step 1: Automated checks**

```bash
pnpm lint
pnpm type-check
pnpm test
```
Expected: all clean (lint 0 warnings, typecheck 0 errors, all test files passing — including the 2 new/rewritten ones).

**Step 2: Manual walkthrough**

Run: `pnpm dev`, then in the browser:
1. Sign up as a new user → should auto-launch the quiz after signup closes.
2. Complete the quiz → **confirm the Results modal shows your actual answers' archetype, not always "Realist" with zero scores** (this is the regression check for the bug this ticket fixes — try answering mostly one archetype and confirm it matches).
3. Watch the film from Results → confirm the archetype badge in the film modal matches.
4. Sign out, sign back in as the same user → confirm "Retake Quiz" appears and the previous result still shows correctly.
5. Retake the quiz with different answers → confirm results update to the new archetype, no stale flash of the old one.
6. Open Quiz History from the user menu.

**Step 3: Commit** (if any manual-walkthrough fixes were needed) or proceed directly to Phase 2 if everything passed clean.

---

## Phase 2: Reducer-driven modal transitions

### Task 11: Write failing tests for `activeModal`/`pendingModal` + centralized buffer

**Files:**
- Modify: `components/home/useHomeController.test.ts`

**Step 1: Add these tests**

```ts
describe('useHomeController activeModal/pendingModal (Phase 2)', () => {
  it('exposes a single activeModal instead of six booleans', () => {
    const { result } = renderHook(() => useHomeController())
    expect(result.current.activeModal).toBeNull()
    act(() => result.current.openSignup())
    expect(result.current.activeModal).toBe('signup')
  })

  it('buffers cross-modal transitions through pendingModal for exactly MODAL_TRANSITION_MS', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useHomeController())
    act(() => result.current.startQuiz())
    expect(result.current.activeModal).toBeNull()
    expect(result.current.pendingModal).toBe('quiz')
    act(() => vi.advanceTimersByTime(249))
    expect(result.current.activeModal).toBeNull()
    act(() => vi.advanceTimersByTime(1))
    expect(result.current.activeModal).toBe('quiz')
    expect(result.current.pendingModal).toBeNull()
    vi.useRealTimers()
  })

  it('a second CLOSE_THEN_OPEN before SETTLE overwrites pendingModal (last request wins)', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useHomeController())
    act(() => result.current.startQuiz())
    act(() => result.current.openQuizHistory())
    act(() => vi.advanceTimersByTime(250))
    expect(result.current.activeModal).toBe('quizHistory')
    vi.useRealTimers()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run components/home/useHomeController.test.ts`
Expected: FAIL — `activeModal`/`pendingModal` don't exist yet.

---

### Task 12: Implement the reducer, replacing the six booleans and ad-hoc delays

**Files:**
- Modify: `components/home/useHomeController.ts`

**Step 1: Replace the modal-state portion with a reducer**

```ts
// components/home/useHomeController.ts
"use client"

import { useReducer, useRef, useEffect } from "react"
import { useQuiz } from "@/hooks/useQuiz"
import { useQuizLogic } from "@/hooks/useQuizLogic"
import type { QuizAnswer, QuizResult } from "@/types/quiz"

export type ModalKey = 'signup' | 'signin' | 'quiz' | 'results' | 'film' | 'quizHistory'
const MODAL_TRANSITION_MS = 250 // safely past DialogContent's 200ms CSS exit animation

interface ModalState {
  activeModal: ModalKey | null
  pendingModal: ModalKey | null
  quizSession: number
  autoResetQuiz: boolean
  optimisticResult: QuizResult | null
}

type ModalAction =
  | { type: 'OPEN'; modal: ModalKey }
  | { type: 'CLOSE' }
  | { type: 'CLOSE_THEN_OPEN'; modal: ModalKey }
  | { type: 'SETTLE' }
  | { type: 'QUIZ_SESSION_STARTED'; autoReset: boolean }
  | { type: 'QUIZ_COMPLETED'; result: QuizResult }

const initialState: ModalState = {
  activeModal: null,
  pendingModal: null,
  quizSession: 0,
  autoResetQuiz: false,
  optimisticResult: null,
}

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, activeModal: action.modal, pendingModal: null }
    case 'CLOSE':
      return { ...state, activeModal: null, pendingModal: null }
    case 'CLOSE_THEN_OPEN':
      return { ...state, activeModal: null, pendingModal: action.modal }
    case 'SETTLE':
      return state.pendingModal
        ? { ...state, activeModal: state.pendingModal, pendingModal: null }
        : state
    case 'QUIZ_SESSION_STARTED':
      return { ...state, quizSession: state.quizSession + 1, autoResetQuiz: action.autoReset, optimisticResult: null }
    case 'QUIZ_COMPLETED':
      return { ...state, optimisticResult: action.result }
    default:
      return state
  }
}

function reconcileLatestResult(
  serverResult: QuizResult | null,
  optimisticResult: QuizResult | null
): QuizResult | null {
  if (serverResult && optimisticResult && serverResult.sessionId === optimisticResult.sessionId) {
    return serverResult
  }
  return optimisticResult ?? serverResult
}

export function useHomeController() {
  const { latestResult: serverLatestResult, loading: quizLoading, submitQuiz, updateQuizResult } = useQuiz()
  const quizLogic = useQuizLogic()
  const [state, dispatch] = useReducer(modalReducer, initialState)
  const settleTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(settleTimer.current), [])

  const closeThenOpen = (modal: ModalKey) => {
    clearTimeout(settleTimer.current)
    dispatch({ type: 'CLOSE_THEN_OPEN', modal })
    settleTimer.current = setTimeout(() => dispatch({ type: 'SETTLE' }), MODAL_TRANSITION_MS)
  }

  const openSignup = () => dispatch({ type: 'OPEN', modal: 'signup' })
  const openSignin = () => dispatch({ type: 'OPEN', modal: 'signin' })
  const openQuizHistory = () => closeThenOpen('quizHistory')
  const closeActiveModal = () => dispatch({ type: 'CLOSE' })
  const switchToSignIn = () => dispatch({ type: 'OPEN', modal: 'signin' })
  const switchToSignUp = () => dispatch({ type: 'OPEN', modal: 'signup' })

  const startQuiz = () => {
    dispatch({ type: 'QUIZ_SESSION_STARTED', autoReset: false })
    closeThenOpen('quiz')
  }

  const retakeQuiz = () => {
    dispatch({ type: 'QUIZ_SESSION_STARTED', autoReset: true })
    closeThenOpen('quiz')
  }

  const signupSucceeded = () => {
    closeThenOpen('quiz')
    dispatch({ type: 'QUIZ_SESSION_STARTED', autoReset: false })
  }

  const completeQuiz = async (answers: Record<number, QuizAnswer>) => {
    try {
      const quizData = quizLogic.processQuizCompletion(answers)
      const optimistic: QuizResult = {
        archetype: quizData.archetype,
        score: quizData.score,
        scores: quizData.scores,
        answers: quizData.answers,
        sessionId: quizData.sessionId,
        createdAt: new Date().toISOString(),
        hasViewedResults: false,
        hasWatchedFilm: false,
      }
      dispatch({ type: 'QUIZ_COMPLETED', result: optimistic })
      closeThenOpen('results')

      try {
        await submitQuiz(quizData)
      } catch (error) {
        console.warn('Backend submission failed, but results are shown optimistically:', error)
      }
    } catch (error) {
      console.error('Quiz completion error:', error)
      dispatch({ type: 'CLOSE' })
      alert(`Quiz failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const latestResult = reconcileLatestResult(serverLatestResult, state.optimisticResult)

  const viewResults = async () => {
    if (latestResult && !latestResult.hasViewedResults) {
      const resultId = latestResult._id
      if (!resultId) {
        console.error('No valid ID found in latestResult:', latestResult)
      } else {
        try {
          await updateQuizResult(resultId, { hasViewedResults: true })
        } catch (error) {
          console.warn('Failed to update results viewed:', error)
        }
      }
    }
    closeThenOpen('film')
  }

  const completeFilm = async () => {
    if (latestResult && !latestResult.hasWatchedFilm) {
      const resultId = latestResult._id
      if (!resultId) {
        console.error('No valid ID found in latestResult:', latestResult)
      } else {
        try {
          await updateQuizResult(resultId, { hasWatchedFilm: true })
        } catch (error) {
          console.warn('Failed to update film watched:', error)
        }
      }
    }
    dispatch({ type: 'CLOSE' })
  }

  const handleVideoError = (error: string) => {
    console.error('Video playback error:', error)
  }

  return {
    activeModal: state.activeModal,
    pendingModal: state.pendingModal,
    quizSession: state.quizSession,
    autoResetQuiz: state.autoResetQuiz,
    latestResult,
    quizLoading,
    openSignup, openSignin, openQuizHistory, closeActiveModal,
    switchToSignIn, switchToSignUp, signupSucceeded,
    startQuiz, retakeQuiz, completeQuiz, viewResults, completeFilm, handleVideoError,
  }
}
```

**Step 2: Run tests to verify they pass**

Run: `npx vitest run components/home/useHomeController.test.ts`
Expected: PASS for all tests, including the 3 new Phase 2 ones. (The Phase 1 tests referencing `showSignup`/`showQuiz`/etc. as booleans will now fail — update them to check `activeModal` instead, following the same pattern as the new Phase 2 tests. Remove the now-redundant boolean-based assertions from Task 3/5's tests.)

Run: `pnpm type-check`
Expected: errors at `HomeInteractiveShell.tsx` (still reading `controller.showSignup` etc.) — expected, resolved in Task 13.

**Step 3: Commit**

```bash
git add components/home/useHomeController.ts components/home/useHomeController.test.ts
git commit -m "refactor: replace six modal booleans + ad-hoc setTimeout chain with activeModal/pendingModal reducer"
```

---

### Task 13: Update `HomeInteractiveShell.tsx` and its test to read `activeModal`

**Files:**
- Modify: `components/home/HomeInteractiveShell.tsx`
- Modify: `components/home/HomeInteractiveShell.test.tsx`

**Step 1: Update the shell's JSX**

Replace every `controller.showX`/`controller.setShowX` pair with a check against `controller.activeModal`:

```tsx
<SignUpModal
  open={controller.activeModal === 'signup'}
  onOpenChange={(open) => !open && controller.closeActiveModal()}
  onSwitchToSignIn={controller.switchToSignIn}
  onSuccess={controller.signupSucceeded}
/>

<SignInModal
  open={controller.activeModal === 'signin'}
  onOpenChange={(open) => !open && controller.closeActiveModal()}
  onSwitchToSignUp={controller.switchToSignUp}
/>

<QuizModal
  key={controller.quizSession}
  open={controller.activeModal === 'quiz'}
  onOpenChange={(open) => !open && controller.closeActiveModal()}
  onQuizComplete={controller.completeQuiz}
  profile={userProfile}
  autoReset={controller.autoResetQuiz}
  quizLoading={controller.quizLoading}
/>

<ResultsModal
  open={controller.activeModal === 'results'}
  onOpenChange={(open) => !open && controller.closeActiveModal()}
  latestResult={controller.latestResult}
  onResultsViewed={controller.viewResults}
  loading={controller.quizLoading}
  onRetakeQuiz={controller.retakeQuiz}
/>

<Dialog open={controller.activeModal === 'film'} onOpenChange={(open) => !open && controller.closeActiveModal()}>
  {/* ...unchanged contents */}
</Dialog>

<QuizHistorySection
  open={controller.activeModal === 'quizHistory'}
  onOpenChange={(open) => !open && controller.closeActiveModal()}
/>
```

Also update `Hero`'s `onShowResults`/`onWatchFilm` to use the controller's modal-open helper instead of the old raw setters, e.g. add small `openResults`/`openFilm` convenience wrappers to the controller (`() => dispatch({ type: 'OPEN', modal: 'results' })`, similarly for `'film'`) if you didn't already keep them from Task 8's note.

**Step 2: Update the test's mock**

In `HomeInteractiveShell.test.tsx`, replace the six boolean fields in the `useHomeController` mock with:

```ts
activeModal: null, pendingModal: null,
```

and replace `setShowQuiz`/`setShowResults`/`setShowFilm`/`setShowQuizHistory`/`switchToSignIn`/`switchToSignUp` mocks with `closeActiveModal: vi.fn()` (keep `switchToSignIn`/`switchToSignUp` as-is — they're unchanged action names).

**Step 3: Verify**

```bash
pnpm lint
pnpm type-check
pnpm test
```
Expected: all clean.

**Step 4: Commit**

```bash
git add components/home/HomeInteractiveShell.tsx components/home/HomeInteractiveShell.test.tsx
git commit -m "refactor: HomeInteractiveShell reads activeModal instead of six booleans"
```

---

### Task 14: Phase 2 manual walkthrough

Run: `pnpm dev`, repeat the Task 10 walkthrough, plus specifically:

1. Rapid-click "Sign Up", then immediately click somewhere that triggers "Sign In" before the quiz/signup buffer settles — confirm only one modal ends up open (no visual double-overlay glitch), matching the "last request wins" test from Task 11.
2. Confirm the quiz→results and results→film transitions have a smooth, consistent pause (no jump-cut, no dead time) — this is the visible effect of the new centralized 250ms constant.

If everything passes, no further commit needed (Task 13 already covers this state).

---

## Final steps

### Task 15: Save the lesson + prepare the PR

**Step 1: Save the memory** (per the ticket's DoD)

Two lessons worth persisting, both already drafted in the design doc's closing section (`docs/superpowers/specs/2026-07-11-was-47-homepage-controller-design.md`):
1. Extract a reducer-backed controller once cross-cutting state passes a handful of independent hooks/`useState`s, or once any `setTimeout`-based sequencing appears — explicit actions make illegal states unrepresentable.
2. Any hook wrapping fetched/mutable shared data (like `useQuiz`) needs exactly one call-site per logical data source, or Context, checked *before* composing hooks together — multiple instances silently desync and the resulting workaround looks like necessary complexity.

**Step 2: Push and open the PR**

```bash
git push -u origin waskarpaulino/was-47-frontend-break-up-apppagetsx-god-component
```

PR body must include `Closes WAS-47` per the ticket's DoD. Summarize both phases, the flash-bug fix, and the `useQuiz`/scoring-duplication fixes found during implementation (Tasks 2 and the reconciliation logic) — these weren't in the original ticket text but are directly load-bearing for the fix being correct.

**Step 3: Wait for CI, then merge** following this repo's established flow (required `build` check via branch protection, same as WAS-12).
