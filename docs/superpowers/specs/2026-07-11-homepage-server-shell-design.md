# WAS-12: Convert homepage to a server-rendered shell

## Problem

`app/page.tsx` is entirely `"use client"` and renders the whole homepage —
interactive quiz/modal logic and mostly-static marketing sections (cast/crew,
contact form, social links, footer) — under one client boundary. This loses
SSR/RSC treatment for the static content and inflates the client bundle.

## Goals

- Static marketing sections render as Server Components.
- Only genuinely interactive pieces (quiz trigger, auth/quiz/results/film
  modals, user menu) are client components.
- No regression in interactive behavior (quiz launch, modals, auth).
- `next build` output / RSC payload shows static sections rendered on the
  server.

## Current state (relevant facts discovered during investigation)

- `app/page.tsx` is `"use client"` and contains `FilmWebsiteContent`: auth
  state (`useAuth`), quiz state (`useQuiz`, `useQuizHandlers`), modal state
  (`useModalState`), local state for quiz session/results, all quiz/results/
  film handler functions, and renders `UserMenu`, `Hero`, a Cast & Crew
  section, a Contact/Social/Footer section, and all modals.
- `CastCrewGrid.tsx`, `CastCrewCarousel.tsx`, and `ContactForm.tsx` use React
  hooks (`useState`/`useEffect`/`useRef`) directly but have **no** `"use
  client"` directive of their own — they only work today because they're
  transitively bundled under `page.tsx`'s client boundary.
- `Hero.tsx` already has its own `"use client"` (it renders the quiz-trigger
  CTA and depends on auth/quiz state passed from the parent).
- `SocialAndEvents.tsx` and `Footer.tsx` have no hooks — already safe as pure
  Server Components.
- `lib/sanity.ts`'s `getCastAndCrew()` and `getSupporters()` currently
  **always** return hardcoded fallback arrays — Sanity fetching is disabled
  (`// For now, always use fallback data to avoid API errors`). There is no
  real network I/O today, so moving these `await` calls into a Server
  Component has no latency/failure-mode risk.
- `components/FilmWebsiteClient.tsx` and `hooks/useCastData.ts` are pre-
  existing dead code (never imported anywhere) — out of scope, left as-is.
- No automated tests cover these components; existing `*.test.ts` files are
  all API-route/lib-level (vitest, node environment).

## Design

### Architecture

```
app/page.tsx (Server Component, async)
  await getCastAndCrew() / await getSupporters()
  └─ HomeInteractiveShell (client)  ── supporters prop
       UserMenu, Hero, {children}, all modals
       └─ children:
            CastCrewSection (Server)   ── castMembers prop
            ContactSocialSection (Server)
```

Modals are overlays, so their position in the JSX tree doesn't affect visual
layout — `{children}` renders between `Hero` and the modals.

### File-by-file changes

| File | Change |
|---|---|
| `app/page.tsx` | Rewritten as an `async` Server Component. Awaits `getCastAndCrew()`/`getSupporters()`, renders `HomeInteractiveShell` wrapping the two new section components. |
| `components/home/HomeInteractiveShell.tsx` (new) | `"use client"`. Owns `useAuth`, `useQuiz`, `useQuizHandlers`, `useModalState`, quiz-session/results local state, all handler functions (`handleQuizComplete`, `handleResultsViewed`, `handleFilmComplete`, `handleStartQuiz`, `handleRetakeQuiz`, `normalizeLatestResult`), the `authLoading` → `LoadingScreen` gate, and JSX for `UserMenu`, `Hero`, `{children}`, and all modals (`SignUpModal`, `SignInModal`, `QuizModal`, `ResultsModal`, film `Dialog`, `QuizHistorySection`). Props: `supporters`, `children`. |
| `components/home/CastCrewSection.tsx` (new) | Plain Server Component. Renders the mobile `CastCrewCarousel` + desktop `CastCrewGrid` wrapper `<section>`. Drops the old client-side loading/retry-button branch — data arrives already resolved. |
| `components/home/ContactSocialSection.tsx` (new) | Plain Server Component. Renders `ContactForm`, `SocialAndEvent`, `Footer` in the existing two-column layout. |
| `components/CastCrewGrid.tsx` | Add explicit `"use client"` directive (no other logic changes). |
| `components/CastCrewCarousel.tsx` | Add explicit `"use client"` directive. |
| `components/ContactForm.tsx` | Add explicit `"use client"` directive. |
| `components/Hero.tsx`, `components/SocialAndEvents.tsx`, `components/Footer.tsx` | No changes. |

### Data flow

```ts
export default async function Page() {
  const castMembers = await getCastAndCrew()
  const supporters = await getSupporters()
  return (
    <HomeInteractiveShell supporters={supporters}>
      <CastCrewSection castMembers={castMembers} />
      <ContactSocialSection />
    </HomeInteractiveShell>
  )
}
```

Because `getCastAndCrew`/`getSupporters` always resolve to a non-empty static
array today, the client-side loading spinner, "no data" retry button, and
`castData` state object are removed — there is nothing left to retry.
`CastCrewGrid`/`CastCrewCarousel` keep their existing
`if (!castMembers || castMembers.length === 0)` placeholder branch as a cheap
defensive fallback, though it won't be reachable in practice today.

### Out of scope

- Re-enabling real Sanity fetching (unrelated, tracked separately if needed).
- Deleting dead code (`FilmWebsiteClient.tsx`, `useCastData.ts`).
- The broader god-component breakup (WAS-47, blocked by this ticket).

## Verification plan

- `pnpm lint:fix && pnpm typecheck`
- `pnpm build` → inspect the route's build output / RSC payload to confirm
  `CastCrewSection`/`ContactSocialSection` are server-rendered.
- Manual run through `pnpm dev`: quiz launch → results → film flow, sign-in/
  sign-up modals, quiz history — all must still work (this is the regression
  risk called out in the DoD).
- No existing automated test suite covers these components; this is a
  lint/typecheck/build + manual-verification change.

## Lesson to save (per ticket DoD)

Client/server split pattern for future pages: a page's Server Component does
data fetching and owns which sections are Server vs Client; a single
"interactive shell" client component wraps only the genuinely stateful UI
and accepts server-rendered static sections via `children` — this keeps the
static content out of the client bundle even though it's visually nested
inside a client component's output. Any leaf component using hooks directly
needs its own explicit `"use client"` once it's no longer nested under a
parent client boundary.
