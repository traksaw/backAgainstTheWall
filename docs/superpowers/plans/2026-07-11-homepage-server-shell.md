# WAS-12: Homepage Server Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `app/page.tsx` from an all-`"use client"` page into a Server Component that fetches data and renders a single client "interactive shell" wrapping server-rendered static sections passed in as `children`.

**Architecture:** `app/page.tsx` (async Server Component) awaits `getCastAndCrew()`/`getSupporters()` and renders `HomeInteractiveShell` (client component: user menu, hero, all quiz/auth/results/film modal state and JSX) with two new plain Server Components (`CastCrewSection`, `ContactSocialSection`) passed in as `children`. Leaf components that use hooks directly (`CastCrewGrid`, `CastCrewCarousel`, `ContactForm`) get their own explicit `"use client"` since they no longer inherit one from the page.

**Tech Stack:** Next.js App Router (RSC), React, TypeScript, Tailwind. No component-level test framework exists in this repo (vitest covers only `lib/`/API routes) — verification is `pnpm lint` / `pnpm type-check` / `pnpm build` plus manual smoke testing via `pnpm dev`.

## Global Constraints

- This repo's actual scripts (per `package.json`) are `pnpm lint`, `pnpm type-check` (not `typecheck`), `pnpm build`, `pnpm test` — use these exact names, not the generic ones from global CLAUDE.md (that file describes a different project's toolchain).
- `getCastAndCrew()` / `getSupporters()` in `lib/sanity.ts` currently always return hardcoded fallback arrays (Sanity fetching is disabled) — no real network I/O, no latency/error-handling concerns to design around.
- Preserve exact current interactive behavior (quiz launch → results → film flow, sign-in/sign-up, quiz history) — this is the DoD's explicit regression risk.
- Out of scope: `components/FilmWebsiteClient.tsx` and `hooks/useCastData.ts` (pre-existing dead code, untouched), re-enabling real Sanity fetching, WAS-47 (god-component breakup).
- Full design context: `docs/superpowers/specs/2026-07-11-homepage-server-shell-design.md`.

---

### Task 1: Give the Cast & Crew leaf components their own client boundary, add the Server Component wrapper

**Files:**
- Modify: `components/CastCrewGrid.tsx:1-14`
- Modify: `components/CastCrewCarousel.tsx:1-14`
- Create: `components/home/CastCrewSection.tsx`

**Interfaces:**
- Consumes: `CastCrewMember` type from `@/data/cast-and-crew` (`{ name: string; role: string; description: string; image?: string; readMoreUrl?: string; order?: number }`)
- Produces: `CastCrewSection` — default export, props `{ castMembers: CastCrewMember[] }`. Task 4 renders this as a child of `HomeInteractiveShell`.

- [ ] **Step 1: Add `"use client"` to `CastCrewGrid.tsx` and loosen `image` to optional**

`CastCrewGrid.tsx` uses `useState`/`useEffect`/`useRef` directly but has no `"use client"` of its own — it only works today because it's nested under `page.tsx`'s client boundary. Once `page.tsx` becomes a Server Component (Task 4), this file needs its own directive or the build fails. Also change its local `CastMember.image` from required to optional — the component never renders `image` (see its "Images removed" comments), but requiring it blocks passing the real `CastCrewMember` type (which declares `image?: string`) once we wire real data through in Task 4.

Change the top of `components/CastCrewGrid.tsx` from:

```tsx
import { useState, useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { FadeInUp } from "@/components/ui/fade-in";
import { cn } from "@/lib/utils";

interface CastMember {
  name: string
  role: string
  description: string
  image: string
  readMoreUrl?: string
  order?: number
  imageAlt?: string
}
```

to:

```tsx
"use client"

import { useState, useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { FadeInUp } from "@/components/ui/fade-in";
import { cn } from "@/lib/utils";

interface CastMember {
  name: string
  role: string
  description: string
  image?: string
  readMoreUrl?: string
  order?: number
  imageAlt?: string
}
```

Nothing else in the file changes.

- [ ] **Step 2: Add `"use client"` to `CastCrewCarousel.tsx` and loosen `image` to optional**

Same reasoning as Step 1. Change the top of `components/CastCrewCarousel.tsx` from:

```tsx
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { FadeIn, FadeInUp } from "@/components/ui/fade-in";

interface CastMember {
  name: string
  role: string
  description: string
  image: string
  readMoreUrl?: string
  order?: number
  imageAlt?: string
}
```

to:

```tsx
"use client"

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { FadeIn, FadeInUp } from "@/components/ui/fade-in";

interface CastMember {
  name: string
  role: string
  description: string
  image?: string
  readMoreUrl?: string
  order?: number
  imageAlt?: string
}
```

Nothing else in the file changes.

- [ ] **Step 3: Create `components/home/CastCrewSection.tsx`**

This is the plain Server Component that replaces the inline "Cast & Crew Section" `<section>` currently in `app/page.tsx`. It renders the mobile carousel and desktop grid, given already-resolved `castMembers` — no loading state, no retry button (nothing left to retry once data is fetched server-side in Task 4).

```tsx
import CastCrewCarousel from "@/components/CastCrewCarousel"
import CastCrewGrid from "@/components/CastCrewGrid"
import type { CastCrewMember } from "@/data/cast-and-crew"

interface CastCrewSectionProps {
  castMembers: CastCrewMember[]
}

export default function CastCrewSection({ castMembers }: CastCrewSectionProps) {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="block md:hidden">
          <CastCrewCarousel castMembers={castMembers} />
        </div>
        <CastCrewGrid castMembers={castMembers} />
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Verify this task compiles on its own**

`app/page.tsx` hasn't changed yet, so `CastCrewSection` is unused but must still compile cleanly, and the two edited components must not break the still-`"use client"` old page.

Run: `pnpm type-check`
Expected: no errors.

Run: `pnpm build`
Expected: build succeeds (the still-unchanged `app/page.tsx` continues to render the old way).

- [ ] **Step 5: Commit**

```bash
git add components/CastCrewGrid.tsx components/CastCrewCarousel.tsx components/home/CastCrewSection.tsx
git commit -m "refactor: give cast/crew leaf components their own client boundary"
```

---

### Task 2: Give ContactForm its own client boundary, add the Contact/Social/Footer Server Component wrapper

**Files:**
- Modify: `components/ContactForm.tsx:1`
- Create: `components/home/ContactSocialSection.tsx`

**Interfaces:**
- Consumes: `ContactForm` (default export, no props), `SocialAndEvent` (default export from `@/components/SocialAndEvents`, no props), `Footer` (default export, no props) — all unchanged.
- Produces: `ContactSocialSection` — default export, no props. Task 4 renders this as a child of `HomeInteractiveShell`.

- [ ] **Step 1: Add `"use client"` to `ContactForm.tsx`**

`ContactForm.tsx` uses `useState` directly with no `"use client"` of its own, for the same reason as Task 1's components. Change the first line of `components/ContactForm.tsx` from:

```tsx
import React, { JSX, useState } from 'react';
```

to:

```tsx
"use client"

import React, { JSX, useState } from 'react';
```

Nothing else in the file changes.

- [ ] **Step 2: Create `components/home/ContactSocialSection.tsx`**

This replaces the inline "Contact & Social" `<section>` currently in `app/page.tsx`. `SocialAndEvent` and `Footer` have no hooks, so they stay pure Server Components rendered directly here.

```tsx
import ContactForm from "@/components/ContactForm"
import SocialAndEvent from "@/components/SocialAndEvents"
import Footer from "@/components/Footer"

export default function ContactSocialSection() {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
            <ContactForm />
            <SocialAndEvent />
          </div>
        </div>
        <Footer />
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Verify this task compiles on its own**

Run: `pnpm type-check`
Expected: no errors.

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add components/ContactForm.tsx components/home/ContactSocialSection.tsx
git commit -m "refactor: give ContactForm its own client boundary"
```

---

### Task 3: Extract the interactive shell

**Files:**
- Create: `components/home/HomeInteractiveShell.tsx`

**Interfaces:**
- Consumes: `useAuth` (`@/hooks/useAuth`), `useQuiz` (`@/hooks/useQuiz`), `useQuizHandlers` (`@/hooks/useQuizHandlers`), `useModalState` (`@/hooks/useModalState`) — all unchanged, existing hooks. `UserMenu`, `Hero`, `QuizModal`, `ResultsModal`, `SignInModal`, `SignUpModal`, `VideoPlayer`, `QuizHistorySection`, `LoadingScreen`, `Dialog` family — all unchanged existing components.
- Produces: `HomeInteractiveShell` — named export, props `{ supporters: Supporter[]; children: ReactNode }`. Task 4 renders this in `app/page.tsx`.

This task moves everything from the current `FilmWebsiteContent` in `app/page.tsx` **except** the Cast & Crew section and the Contact/Social/Footer section (now handled by Tasks 1–2's Server Components, rendered as `children` in Task 4). The cast-data-fetching `useEffect` and `castData` state are dropped entirely — that logic no longer belongs on the client (Task 4 fetches server-side).

- [ ] **Step 1: Create `components/home/HomeInteractiveShell.tsx`**

```tsx
"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { QuizModal } from "@/components/quiz/QuizModal"
import { ResultsModal } from "@/components/results/ResultsModal"
import { UserMenu } from "@/components/layout/UserMenu"
import { LoadingScreen } from "@/components/layout/LoadingScreen"
import { SignInModal } from "@/components/auth/SignInModal"
import { SignUpModal } from "@/components/auth/SignUpModal"
import Hero from "@/components/Hero"
import { VideoPlayer } from "@/components/VideoPlayer"
import { QuizHistorySection } from "@/components/QuizHistorySection"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useModalState } from "@/hooks/useModalState"
import { useQuizHandlers } from "@/hooks/useQuizHandlers"
import { useAuth } from "@/hooks/useAuth"
import { useQuiz } from "@/hooks/useQuiz"
import type { QuizResult as TypesQuizResult, Archetype, QuizScores, QuizAnswer as TypesQuizAnswer } from '@/types/quiz'
import type { QuizResult, QuizAnswer } from '@/lib/quiz'
import type { Supporter } from "@/types/supporter"
import type { User, Profile } from "@/types/auth"

interface HomeInteractiveShellProps {
  supporters: Supporter[]
  children: ReactNode
}

export function HomeInteractiveShell({ supporters, children }: HomeInteractiveShellProps) {
  const { user: rawUser, profile: rawProfile, signOut, loading: authLoading } = useAuth()

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

  const { latestResult, refreshResults, loading: quizLoading } = useQuiz()
  const [localLatestResult, setLocalLatestResult] = useState<QuizResult | null>(null)
  const [quizSession, setQuizSession] = useState(0)
  const [autoResetQuiz, setAutoResetQuiz] = useState(false)

  const modals = useModalState()
  const quizHandlers = useQuizHandlers()

  const handleQuizComplete = async (finalAnswers: Record<number, TypesQuizAnswer>) => {
    try {
      const sessionId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const scores: QuizScores = { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 };
      const archetype: Archetype = 'Realist';

      modals.setShowQuiz(false);

      const formattedResult: QuizResult = {
        _id: sessionId,
        id: sessionId,
        archetype: archetype,
        score: 0,
        scores: scores,
        createdAt: new Date().toISOString(),
        hasViewedResults: false,
        hasWatchedFilm: false,
        answers: finalAnswers,
        sessionId: sessionId
      };

      setLocalLatestResult(formattedResult);

      setTimeout(() => {
        modals.setShowResults(true);
      }, 300);

      try {
        const convertedAnswers: Record<number, QuizAnswer> = {};
        Object.entries(finalAnswers).forEach(([key, answer]) => {
          convertedAnswers[Number(key)] = {
            id: answer.id || 0,
            archetype: answer.archetype,
            points: answer.points,
            text: answer.text,
            questionId: answer.questionId,
            question: answer.question
          };
        });

        await quizHandlers.handleQuizComplete(convertedAnswers);
        await refreshResults();
      } catch (error) {
        console.warn('Backend submission failed, but results are shown optimistically:', error)
      }

    } catch (error) {
      console.error('❌ Quiz completion error:', error);
      modals.setShowQuiz(false);
      alert(`Quiz failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const handleResultsViewed = async () => {
    try {
      if (localLatestResult) {
        setLocalLatestResult({
          ...localLatestResult,
          hasViewedResults: true
        });
      }

      const resultToUpdate = normalizeLatestResult(latestResult) || localLatestResult;
      if (resultToUpdate) {
        await quizHandlers.handleResultsViewed(resultToUpdate);
      }

      modals.setShowResults(false);
      modals.setShowFilm(true);
    } catch (error) {
      console.warn('Failed to update results, but proceeding to show film:', error);
      modals.setShowResults(false);
      modals.setShowFilm(true);
    }
  }

  const handleFilmComplete = async () => {
    await quizHandlers.handleFilmComplete(latestResult)
    modals.setShowFilm(false)
  }

  const handleStartQuiz = () => {
    setQuizSession((s) => s + 1)
    setTimeout(() => {
      modals.openQuiz()
    }, 50)
  }

  const handleRetakeQuiz = () => {
    modals.closeAllModals()
    setQuizSession((s) => s + 1)
    setTimeout(() => {
      setAutoResetQuiz(true)
      modals.openQuiz()
    }, 150)
  }

  function normalizeLatestResult(raw: QuizResult | null): TypesQuizResult | null {
    if (raw && (raw._id || raw.id)) {
      const scores: QuizScores = raw.scores ?? { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 };

      return {
        _id: raw._id || raw.id || '',
        id: String(raw._id ?? raw.id ?? ''),
        archetype: raw.archetype as Archetype,
        score: Number(raw.score ?? 0),
        scores,
        createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : undefined,
        hasViewedResults: raw.hasViewedResults ?? false,
        hasWatchedFilm: raw.hasWatchedFilm ?? false,
        answers: raw.answers as Record<number, TypesQuizAnswer> | undefined,
        sessionId: raw.sessionId
      }
    }

    if (localLatestResult) {
      return localLatestResult;
    }

    return null;
  }

  if (authLoading) {
    return <LoadingScreen message="Loading..." />
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <UserMenu
        user={user}
        profile={profile}
        onSignOut={signOut}
        onShowQuizHistory={modals.openQuizHistory}
      />

      <Hero
        user={user}
        latestResult={latestResult}
        supporters={supporters}
        onSignUp={modals.openSignup}
        onStartQuiz={handleStartQuiz}
        onRetakeQuiz={handleRetakeQuiz}
        onShowResults={modals.openResults}
        onWatchFilm={modals.openFilm}
      />

      {children}

      <SignUpModal
        open={modals.showSignup}
        onOpenChange={modals.setShowSignup}
        onSwitchToSignIn={modals.switchToSignIn}
        onSuccess={() => {
          modals.setShowSignup(false)
          setTimeout(() => {
            handleStartQuiz()
          }, 100)
        }}
      />

      <SignInModal
        open={modals.showSignin}
        onOpenChange={modals.setShowSignin}
        onSwitchToSignUp={modals.switchToSignUp}
      />

      <QuizModal
        key={quizSession}
        open={modals.showQuiz}
        onOpenChange={(open) => {
          if (!open) {
            setQuizSession((s) => s + 1)
            setAutoResetQuiz(false)
          }
          modals.setShowQuiz(open)
        }}
        onQuizComplete={handleQuizComplete}
        profile={userProfile}
        autoReset={autoResetQuiz}
      />

      <ResultsModal
        open={modals.showResults}
        onOpenChange={(open) => {
          modals.setShowResults(open)
        }}
        latestResult={normalizeLatestResult(latestResult)}
        onResultsViewed={handleResultsViewed}
        loading={quizLoading}
        onRetakeQuiz={handleRetakeQuiz}
      />

      <Dialog open={modals.showFilm} onOpenChange={modals.setShowFilm}>
        <DialogContent className="w-[95vw] max-w-5xl bg-black border-0 max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-white">
              Back Against the Wall
            </DialogTitle>
            <DialogDescription className="text-center text-gray-300 text-sm sm:text-base px-2">
              {user && latestResult?.archetype ? (
                <>
                  Watching as <span className="text-[#B95D38]">The {latestResult.archetype}</span> — Notice how the
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
              onEnded={handleFilmComplete}
              onError={quizHandlers.handleVideoError}
              className="aspect-video w-full"
              autoPlay={false}
            />
            {latestResult?.archetype && (
              <div className="absolute top-4 right-4 z-30">
                <div className="bg-[#B95D38]/90 text-white px-3 py-1 rounded-full text-sm font-medium">
                  The {latestResult.archetype}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <QuizHistorySection
        open={modals.showQuizHistory}
        onOpenChange={modals.setShowQuizHistory}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify this task compiles on its own**

Run: `pnpm type-check`
Expected: no errors. (`HomeInteractiveShell` is unused until Task 4, which is fine — unused exports don't fail typecheck or `next lint`.)

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/home/HomeInteractiveShell.tsx
git commit -m "refactor: extract homepage interactive shell into its own client component"
```

---

### Task 4: Wire it together in `app/page.tsx` and verify the whole page

**Files:**
- Modify: `app/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `getSupporters`, `getCastAndCrew` (`@/lib/sanity`), `HomeInteractiveShell` (Task 3), `CastCrewSection` (Task 1), `ContactSocialSection` (Task 2).

This is the behavioral change: `app/page.tsx` stops being `"use client"`, becomes an `async` Server Component, fetches data with plain `await`, and composes the three pieces built in Tasks 1–3.

- [ ] **Step 1: Rewrite `app/page.tsx`**

Replace the entire contents of `app/page.tsx` with:

```tsx
import { getSupporters, getCastAndCrew } from "@/lib/sanity"
import { HomeInteractiveShell } from "@/components/home/HomeInteractiveShell"
import CastCrewSection from "@/components/home/CastCrewSection"
import ContactSocialSection from "@/components/home/ContactSocialSection"

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

- [ ] **Step 2: Run lint and typecheck**

Run: `pnpm lint`
Expected: no errors (fix any that appear — e.g. unused imports left over from a partial edit — before continuing).

Run: `pnpm type-check`
Expected: no errors.

- [ ] **Step 3: Run the production build and confirm the RSC/server-rendering split**

Run: `pnpm build`
Expected: build succeeds. In the route output, `/` should be listed without the client-bundle warning size it had before (compare to the pre-change build if you want a before/after diff — not required to block the task, just informative).

Then confirm the static sections are actually server-rendered: run `pnpm build && pnpm start`, open `http://localhost:3000` with JavaScript disabled (or view-source / `curl http://localhost:3000`), and confirm the cast & crew names/roles and the contact form's static copy ("Get in Touch", social links, footer copyright) appear in the raw HTML. If they only appear after JS loads, the server/client split isn't working and this step should fail back to Task 1–3 review.

- [ ] **Step 4: Manual smoke test of interactive behavior**

Run: `pnpm dev`, open `http://localhost:3000`, and walk through:
1. Click "Sign Up to Begin" (logged out) → `SignUpModal` opens.
2. Sign up or sign in with a test account → quiz auto-launches (`handleStartQuiz` via `onSuccess`).
3. Complete the quiz → `ResultsModal` shows.
4. Proceed to the film → film `Dialog` with `VideoPlayer` opens and plays.
5. Click the user menu's history icon (top-right, once signed in) → `QuizHistorySection` opens.
6. Sign out, reload, click "Retake Quiz" from a returning-user state → quiz reopens fresh.

Expected: every step behaves identically to how it did before this refactor (this is the DoD's explicit "no regression in interactive behavior" requirement). If anything differs, check whether the prop wiring in `HomeInteractiveShell` (Task 3, Step 1) was copied faithfully from the original `FilmWebsiteContent`.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: convert homepage to a server-rendered shell (WAS-12)"
```

---

## Self-Review Notes

- **Spec coverage:** Every file listed in the spec's "File-by-file changes" table has a task (Tasks 1–4). Data-flow change (server `await`, dropped loading/retry state) is in Task 4. Verification plan (lint/type-check/build/RSC check/manual walkthrough) is in Task 4, Steps 2–4.
- **Type consistency:** `CastCrewMember` (from `@/data/cast-and-crew`) is the single type used for cast data from `page.tsx` through `CastCrewSection` down to `CastCrewGrid`/`CastCrewCarousel`'s local `CastMember` interfaces (loosened `image` to optional in Task 1 so they structurally accept `CastCrewMember`). No `as unknown as` casts needed anywhere in this plan.
- **Out of scope reminders carried into PR description:** dead code (`FilmWebsiteClient.tsx`, `useCastData.ts`) untouched; no Sanity re-enablement; WAS-47 remains a separate ticket.
