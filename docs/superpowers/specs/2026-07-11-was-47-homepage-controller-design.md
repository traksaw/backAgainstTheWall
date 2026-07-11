# WAS-47: Break up app/page.tsx god component

## Problem

The ticket was written against the pre-WAS-12 shape (`app/page.tsx` at 482
lines). WAS-12 already moved all the interactive logic into
`components/home/HomeInteractiveShell.tsx` (293 lines) and reduced
`app/page.tsx` to a 16-line Server Component. The god-component problem the
ticket describes is real, it's just moved: `HomeInteractiveShell.tsx` now
orchestrates six `useModalState` booleans (kept mutually exclusive only by
convention — every `open*` helper calls `closeAllModals()` first), three raw
`useState`s, two overlapping hooks (`useQuizHandlers`, `useQuizLogic`), and
four different `setTimeout` delays (50ms/100ms+50ms/150ms/300ms) used as an
ad-hoc animation-sequencing state machine.

## Goals

- `HomeInteractiveShell.tsx` is meaningfully shorter and contains no
  `setTimeout`-based state sequencing.
- One canonical `QuizResult`/`Archetype`/`QuizAnswer` type family — no more
  manual field-by-field conversion between two structurally-identical
  interfaces.
- All existing interactive flows (quiz launch, auth modals, results, film,
  retake, quiz history) verified working manually, with no regression.
- Tests/lint/typecheck pass.

## Current state (relevant facts discovered during investigation)

- **`useQuiz()` is not shared state.** Unlike `useAuth` (Context-backed, one
  instance app-wide), `useQuiz()` is a plain hook with its own local
  `useState`. Three independent instances are alive at once today: inside
  `HomeInteractiveShell` itself (the one that actually feeds `latestResult`
  to `Hero`/`ResultsModal`), inside `useQuizHandlers` (the one that actually
  calls `submitQuiz`/`refreshResults`), and inside `QuizModal` (only used to
  read `quizLoading`, which as a result never actually triggers). Because the
  shell's own instance only re-fetches when `user?._id` changes, it never
  learns about a freshly-submitted quiz result on its own.
- **This is the real reason the `localLatestResult`/`normalizeLatestResult`
  workaround exists.** `handleQuizComplete` builds a local optimistic
  `QuizResult` with **hardcoded `archetype: 'Realist'` and all-zero scores**
  (not derived from the actual answers), shows it after a 300ms
  `setTimeout`, and lets the real submission happen in the background. This
  is a live bug: the Results modal can flash the wrong archetype for a
  moment on every completion.
- **The `setTimeout` delays don't reliably do what they're for.** Each modal
  is a separate `<Dialog>` instance; `DialogContent`'s CSS exit/enter
  animation is `duration-200` (200ms). Two of today's four delays (50ms, and
  100ms+50ms chained) undershoot that, meaning the "wait for the old modal to
  finish animating out" buffer they're standing in for doesn't reliably work
  even today.
- Two parallel type families: `types/quiz.ts` and `lib/quiz.ts` each declare
  their own `Archetype`, `QuizAnswer`, and `QuizResult` — structurally
  identical (`lib/quiz.ts`'s `QuizResult` additionally has `userId`/
  `updatedAt`). The "conversion" functions in the shell are pure copies, a
  no-op at runtime that TypeScript can't see through structurally.
- `sessionId` round-trips reliably: the submit API
  (`app/api/quiz/submit/route.ts`) persists it on the Mongoose model
  (`models/QuizResult.ts`) and returns the created document, so a
  client-computed optimistic result and the eventual server-confirmed result
  can be matched by `sessionId`.
- `QuizModal` has its own internal reset mechanism (`key={quizSession}` forced
  remount, plus an `autoReset` prop + internal `hardReset()`) and its own
  question-flow state (`useQuizState`) — both out of scope for this ticket.

## Design

### Architecture

```
HomeInteractiveShell (client)
  useAuth()              — unchanged, Context-backed
  useHomeController()    — new, replaces useModalState + useQuizHandlers +
                            useQuizLogic-orchestration + 3 raw useState's +
                            all setTimeout sequencing + the useQuiz() calls
                            in useQuizHandlers/QuizModal
       │
       ├─ sole useQuiz() call site (submitQuiz, updateQuizResult, refreshResults,
       │   server latestResult, loading)
       ├─ useQuizLogic() (unchanged, pure — processQuizCompletion etc.)
       └─ ControllerState (useReducer)
```

### State shape

```ts
type ModalKey = 'signup' | 'signin' | 'quiz' | 'results' | 'film' | 'quizHistory'

interface ControllerState {
  activeModal: ModalKey | null
  pendingModal: ModalKey | null   // set only during the 250ms buffered swap
  quizSession: number             // still passed as QuizModal's remount key
  autoResetQuiz: boolean
  optimisticResult: QuizResult | null
}
```

`activeModal` replaces the six `useModalState` booleans — "only one modal
open" becomes a type-level fact instead of a convention enforced by calling
`closeAllModals()` before every `open*` call.

### Modal transitions

Two kinds, both explicit reducer actions — no component calls `setTimeout`
directly:

- **Immediate** (`OPEN`, `CLOSE`): no visual conflict — opening
  `quizHistory` from fully-closed, or the signup↔signin swap (today's
  `switchToSignIn`/`switchToSignUp` already skip the close-all step).
- **Buffered** (`CLOSE_THEN_OPEN`): every other cross-modal transition
  (start quiz, quiz→results, results→film, retake). Sets
  `activeModal: null, pendingModal: <target>` immediately; the controller's
  effect layer schedules one `dispatch({ type: 'SETTLE' })` after a single
  centralized 250ms constant (safely past the real 200ms CSS animation),
  moving `pendingModal` → `activeModal`. This replaces four inconsistent,
  partly-incorrect delays with one correct one.

### Quiz-completion data flow (fixes the flash-bug and the useQuiz split)

`completeQuiz(answers)`:
1. Synchronously compute `quizData = quizLogic.processQuizCompletion(answers)`
   — real archetype/scores, reusing existing correct logic. No more
   hardcoded placeholder.
2. Dispatch `QUIZ_COMPLETED` with a `QuizResult` built from `quizData`
   (real `sessionId`, no server `_id` yet) → sets `optimisticResult` and
   fires `CLOSE_THEN_OPEN('results')`. Same instant responsiveness as today.
3. `await submitQuiz(answers, quizData.sessionId)` in the background. On
   success, `useQuiz`'s own `latestResult` now holds the server-confirmed
   record (real `_id`, same `sessionId`). On failure: `console.warn`, exactly
   as today — the UI keeps showing the optimistic result, never blocks or
   surfaces an error.

The controller's exposed `latestResult` = *server result if its `sessionId`
matches `optimisticResult.sessionId`, else `optimisticResult`* — the direct,
type-unified replacement for `normalizeLatestResult`.

`viewResults`/`completeFilm` call `updateQuizResult(resultId, …)` only when a
real server `_id` exists (mirrors today's `if (!resultId) return` guard).

`QUIZ_SESSION_STARTED` (fired by `startQuiz` and `retakeQuiz`) clears
`optimisticResult: null` alongside incrementing `quizSession` — this is what
prevents a stale result from a prior attempt leaking into a retake, as a
consequence of correct state modeling rather than a special case.

### File-by-file changes

| File | Change |
|---|---|
| `components/home/useHomeController.ts` (new) | Reducer-backed controller. Sole `useQuiz()` call site. Returns `activeModal`, `latestResult` (reconciled), `quizLoading`, `quizSession`, `autoResetQuiz`, and action functions (`openSignup`, `openSignin`, `openQuizHistory`, `closeActiveModal`, `switchToSignIn`, `switchToSignUp`, `startQuiz`, `retakeQuiz`, `completeQuiz`, `viewResults`, `completeFilm`, `handleVideoError`). |
| `components/home/HomeInteractiveShell.tsx` | Rewritten to call `useAuth()` + `useHomeController()` only; JSX becomes a thin composition keyed off `activeModal`/`pendingModal`. |
| `hooks/useModalState.ts` | Deleted — fully subsumed. |
| `hooks/useQuizHandlers.ts` | Deleted — responsibilities move into the controller's `completeQuiz`/`viewResults`/`completeFilm`. |
| `hooks/useQuizLogic.ts` | Unchanged — pure logic, called by the controller the same way. |
| `hooks/useQuiz.ts` | Unchanged internally — now called from exactly one place. |
| `components/quiz/QuizModal.tsx` | Stops calling `useQuiz()` itself; takes `quizLoading` as a new prop. |
| `types/quiz.ts` | Canonical `QuizResult`/`Archetype`/`QuizAnswer`. Add optional `userId?`/`updatedAt?` to `QuizResult` (currently only on `lib/quiz.ts`'s copy). |
| `lib/quiz.ts` | Deletes its local type declarations, imports from `types/quiz.ts`. `QuizService` methods unchanged. |
| `components/home/HomeInteractiveShell.test.tsx` | Mocks rewritten against `useHomeController`/`useAuth` instead of the four retired hooks; existing auth-loading-gate assertion preserved unchanged. |
| `components/home/useHomeController.test.ts` (new) | Pure reducer unit tests: every action/transition plus the `latestResult` reconciliation rule. |

### Out of scope

- `QuizModal`'s internal `useQuizState` (question-flow logic) and its dual
  reset mechanism (`key={quizSession}` remount + `autoReset`/`hardReset`) —
  unrelated to the cross-cutting state problem this ticket targets.
- Context-ifying `useQuiz` (considered and rejected — bigger blast radius
  than making the controller its sole caller, for an already high-risk
  ticket).
- Animation-`onAnimationEnd`-driven transition detection instead of a fixed
  buffer constant (considered and rejected — bigger change than this
  ticket's scope; fixed 250ms constant is correct enough given the known
  200ms CSS duration).
- Re-enabling real Sanity fetching, and the WAS-12 server/client split
  itself (already done).

## Verification plan

- `pnpm lint:fix && pnpm typecheck`
- `pnpm test` — new `useHomeController.test.ts` reducer tests, rewritten
  `HomeInteractiveShell.test.tsx`, full existing suite.
- Manual run through `pnpm dev`: sign up → auto quiz launch → complete quiz →
  results (confirm no wrong-archetype flash) → watch film → sign out → sign
  in → retake quiz → quiz history modal → rapid double-click during a modal
  transition (confirm no dual-modal visual glitch).

## Lesson to save (per ticket DoD)

When a client component's cross-cutting state grows past a handful of
independent `useState`/hook calls — especially "only one of N things visible
at a time" state, or any `setTimeout`-based sequencing — extract a single
reducer-backed controller hook instead of composing more independent hooks.
Explicit action types make illegal states (two modals open, a transition
buffer of the wrong duration) unrepresentable, where boolean flags only make
them unlikely.

Separately: any hook wrapping fetched/mutable shared data (like `useQuiz`)
must have exactly one call-site per logical data source, or be Context-backed
like `useAuth`. Check this *before* composing hooks together — multiple
independent instances silently desync, and the resulting workaround (an
optimistic local copy, a manual re-fetch trigger) looks like necessary
complexity when it's actually just papering over the sharing bug.
