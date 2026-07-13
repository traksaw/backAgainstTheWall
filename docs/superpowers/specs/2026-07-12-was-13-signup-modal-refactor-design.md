# WAS-13: Refactor SignUpModal onto shared form infra

## Problem

`components/auth/SignUpModal.tsx` is a 658-line, 3-step wizard that hand-rolls
everything react-hook-form already gives the rest of the app for free:
per-field `useState`, three separate `validateStepN()` functions duplicating
regex/length rules that already exist server-side, and an inline
`getPasswordStrength`/`getPasswordStrengthLabel` pair. `components/ui/form.tsx`
(a standard shadcn wrapper around `FormProvider`/`Controller`) exists in the
repo but nothing uses it yet.

## Goals

- Same 3-step flow, same copy, same visuals (progress dots, colors, step
  descriptions) — a user cannot tell the difference.
- Validation logic lives in one zod schema instead of three hand-rolled
  `validateStepN` functions.
- Password-strength scoring is a standalone, reusable utility, not inline in
  the component.
- The multi-step/react-hook-form pattern (`useSignUpForm`) is reusable by the
  next multi-step form instead of being re-invented.
- Tests/lint/typecheck pass; manually verified in browser.

## Current state (relevant facts discovered during investigation)

- `components/ui/form.tsx` already exports `Form` (=`FormProvider`),
  `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`,
  `FormMessage` — the standard shadcn pattern. `FormField`'s `Controller` picks
  up `control` from whatever is passed to it; the repo convention (seen
  nowhere yet, since this is the first real usage, but standard shadcn usage)
  is to pass `control={form.control}` explicitly rather than relying on
  `useFormContext()` inside `Controller` implicitly.
- `react-hook-form`, `@hookform/resolvers`, and `zod` are already
  dependencies — no new packages needed.
- `lib/validation.ts` (landed via WAS-8) already has a server-side
  `signUpSchema`:
  ```ts
  export const signUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    zip_code: z.string().min(1),
    occupationStatus: z.string().min(1),
  })
  ```
  It intentionally only requires `password.min(1)` — the 8-char/letter+number
  strength rule today lives purely client-side in `SignUpModal`'s
  `validateStep2`. The client schema needs to stay *stricter* than the server
  schema (better UX, fail fast) without the server schema changing — this
  ticket is frontend-only and doesn't touch the signup API route.
- `SignUpModal` currently posts `{ email, password, passwordConfirmation,
  firstName, lastName, zip_code, occupationStatus, acceptTerms }` to
  `useAuth().signUp()`, but only `email/password/firstName/lastName/zip_code/
  occupationStatus` are consumed server-side (`lib/auth.ts` `AuthService.signUp`
  reads exactly those six fields). `passwordConfirmation` and `acceptTerms` are
  UI-only concerns — they must stay in the client schema/form state but are
  harmless extra fields on the wire (server already ignores unknown fields;
  no change needed there).
- No existing test or e2e spec covers `SignUpModal`'s UI today (only
  `app/api/auth/signup/route.test.ts`, which tests the API route and is
  untouched by this ticket) — the DoD's stated verification is manual-in-
  browser. This design adds a first, narrowly-scoped `SignUpModal.test.tsx`
  anyway; see "Regression tests" below for why.
- `TermsModal`/`PrivacyModal` are pre-existing, self-contained modals; step 3
  just toggles their `open` state.

## Design

### Architecture

```
SignUpModal (client)
  useSignUpForm()                 — new hook, owns:
       │                            - useForm() + zodResolver(signUpFormSchema)
       │                            - currentStep state + goNext/goBack
       │                            - onSubmit → useAuth().signUp()
       │                            - submitError, loading, resetForm
       │
       ├─ <Form {...form}>  (FormProvider, from components/ui/form.tsx)
       │    ├─ BasicInfoStep     (step 1: firstName, lastName, email)
       │    ├─ SecurityStep      (step 2: password, passwordConfirmation,
       │    │                      zip_code, occupationStatus)
       │    └─ TermsStep         (step 3: acceptTerms + Terms/Privacy modals)
       │
       └─ lib/password-strength.ts  — pure getPasswordStrength/
                                       getPasswordStrengthLabel, used only by
                                       SecurityStep's meter
```

### Zod schema (`lib/validation.ts`, next to `signUpSchema`)

**Revised during implementation (Task 2 review caught a real bug in the
original version of this section — see below).** `.omit({password: true})`
keeps this structurally tied to `signUpSchema` (TypeScript errors if
`signUpSchema` ever drops one of these keys), but every field is defined
fresh in `.extend()` rather than chaining extra checks onto
`signUpSchema.shape.X`:

```ts
export const signUpFormSchema = signUpSchema
  .omit({ password: true })
  .extend({
    firstName: z.string().min(1, "First name is required").min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(1, "Last name is required").min(2, "Last name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    zip_code: z
      .string()
      .min(1, "Zip code is required")
      .regex(/^\d{5}(-\d{4})?$/, "Please enter a valid zip code (e.g., 12345 or 12345-6789)"),
    occupationStatus: z.string().min(1, "Please select your current status"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/(?=.*[a-zA-Z])(?=.*\d)/, "Password must contain at least one letter and one number"),
    passwordConfirmation: z.string().min(1, "Please confirm your password"),
    acceptTerms: z
      .boolean()
      .refine((v) => v === true, { message: "You must accept the terms and conditions to continue" }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  })

export type SignUpFormValues = z.infer<typeof signUpFormSchema>
```

**Why not chain onto `signUpSchema.shape.X`** (the original version of this
schema did, for `firstName`/`lastName`/`zip_code`, and left `email`/
`occupationStatus` fully inherited unchanged): `signUpSchema`'s fields
already carry an earlier, unlabeled `.min(1)` (or, for `email`, a bare
`.email()`). Zod evaluates a chain's checks in the order they were added and
collects every failing issue for a field; `@hookform/resolvers/zod` then
surfaces only the *first* issue per field path. Chaining a new, better
message onto an inherited field adds it as a *later* check — so for the
exact case that message exists to handle (an empty/invalid input), the
earlier inherited check fails first and its generic, unlabeled Zod message
("String must contain at least 1 character(s)") wins instead, silently
burying the intended copy. `occupationStatus` was worse: reused with zero
override, so its hand-rolled message ("Please select your current status")
was never wired in at all. Defining every field fresh in `.extend()` avoids
inheriting any earlier check, so chained `.min()`/`.regex()`/`.email()`
calls fire in the intended order and their messages are reachable. This was
caught empirically (by executing the schema against `zod@3.25.76`) during
Task 2's review, not by inspection — a reminder that message-ordering bugs
in a validation chain don't show up from reading the chain, only from
running it against the failure case each check exists for.

### `hooks/useSignUpForm.ts`

```ts
const STEP_FIELDS: Record<number, (keyof SignUpFormValues)[]> = {
  1: ["firstName", "lastName", "email"],
  2: ["password", "passwordConfirmation", "zip_code", "occupationStatus"],
  3: ["acceptTerms"],
}

function useSignUpForm({ onOpenChange, onSuccess }: {
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const { signUp } = useAuth()
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    shouldUnregister: false, // step components unmount on step change; values must survive that (see "RHF gotchas" below)
    defaultValues: { email: "", password: "", passwordConfirmation: "", firstName: "", lastName: "", zip_code: "", occupationStatus: "", acceptTerms: false },
  })
  const [currentStep, setCurrentStep] = useState(1)
  // Gates error DISPLAY per step — see "Premature step-3 error" below for
  // why this can't just be formState.errors itself.
  const [stepAttempted, setStepAttempted] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [loading, setLoading] = useState(false)

  const goNext = async () => {
    if (await form.trigger(STEP_FIELDS[currentStep])) {
      setStepAttempted(false)
      setCurrentStep((s) => s + 1)
    } else {
      setStepAttempted(true)
    }
  }
  const goBack = () => {
    setStepAttempted(false)
    setCurrentStep((s) => Math.max(1, s - 1))
  }

  const resetForm = () => {
    form.reset()
    setCurrentStep(1)
    setStepAttempted(false)
    setSubmitError("")
  }

  const onSubmit = form.handleSubmit(
    async (values) => {
      setSubmitError("")
      setLoading(true)
      try {
        await signUp(values)
        resetForm()
        onOpenChange(false)
        onSuccess()
      } catch (err) {
        setSubmitError(mapSignUpError(err)) // same message-mapping logic as today, moved verbatim
      } finally {
        setLoading(false)
      }
    },
    () => setStepAttempted(true)
  )

  return { form, currentStep, stepAttempted, goNext, goBack, onSubmit, submitError, loading, resetForm }
}
```

`mapSignUpError` is today's inline `catch` block logic
(already-registered/invalid-email/password substring checks), moved verbatim
as a private helper in the same file — it's specific to this flow, not
generalized further.

### Step components (`components/auth/signup-steps/`)

Each step is presentational and pulls `control`/`watch` off
`useFormContext<SignUpFormValues>()` — no props threaded down from
`SignUpModal` beyond what's already in context via `<Form {...form}>`:

- **`BasicInfoStep.tsx`** — firstName/lastName/email `FormField`s, same
  layout/icons/copy as today's step 1 JSX.
- **`SecurityStep.tsx`** — password/passwordConfirmation/zip_code/
  occupationStatus `FormField`s. Owns local `showPassword`/
  `showPasswordConfirm` toggle state (pure UI, not form data) and the
  strength meter, computed via `useWatch({ name: "password" })` +
  `lib/password-strength.ts`. `occupationStatus` stays a **native `<select>`**
  (not the styled `components/ui/select.tsx` Radix component) — wired as
  `<select value={field.value} onChange={field.onChange}>`, matching today's
  markup exactly. Swapping to the Radix `Select` would change the rendered
  markup/visuals and is out of scope.
- **`TermsStep.tsx`** — `acceptTerms` `FormField` (checkbox), owns local
  `showTermsModal`/`showPrivacyModal` state and renders `TermsModal`/
  `PrivacyModal`, same terms copy block as today. `components/ui/checkbox`'s
  `onCheckedChange` is Radix-typed (`boolean | "indeterminate"`), but the
  schema field is a plain `boolean` — wire it as
  `onCheckedChange={(checked) => field.onChange(checked === true)}` to coerce.

### RHF gotchas this design depends on

- **`shouldUnregister: false`** (set explicitly in `useForm()`, not left to
  the default) — step components conditionally unmount
  (`{currentStep === 1 && <BasicInfoStep />}`), and RHF drops a field's value
  when it unmounts if `shouldUnregister` is `true`. Without this pinned
  explicitly, Back navigation would silently lose step 1/2 data the moment
  RHF's default changes or someone "cleans up" the config — a direct
  regression against the "identical from a user's perspective" goal, so it's
  pinned rather than relied on implicitly.
- `FormField`'s `Controller` is passed `control={form.control}` explicitly
  (obtained via `useFormContext()` inside each step component) — this is the
  standard shadcn pattern and avoids threading `control` down as a prop from
  `SignUpModal`.
- **Premature step-3 error, found during Task 9 manual browser
  verification — root-caused twice.** `TermsStep` renders "You must accept
  the terms and conditions to continue" immediately on arrival at step 3,
  before the user has touched the checkbox. Confirmed reproducible against a
  genuine dev-mode build (not a stale-bundle artifact).
  - **First diagnosis (wrong, but shipped and passed review before being
    caught empirically):** the theory was that `form.trigger(stepFields)`
    leaks other fields' errors into `formState.errors` because
    `zodResolver` can't partially validate one object schema. The proposed
    fix (`form.clearErrors(fieldsNotInThisStep)` after a successful
    `trigger()`, `form.clearErrors()` on `goBack()`) was implemented and
    passed an independent task review that traced the code and confirmed
    the field sets matched — but it did **not** fix the bug when re-tested
    live. Reading react-hook-form's actual `trigger()` source
    (`node_modules/react-hook-form/dist/index.cjs.js`) disproved the
    theory directly: `trigger(names)` only ever *writes* `formState.errors`
    entries for the fields in `names`, even though the resolver internally
    validates the whole schema to get there — it does not touch unrelated
    fields at all. Confirmed empirically too: temporary `console.log`s
    around `goNext()`'s `trigger()` call showed `formState.errors` staying
    empty through the entire step-2 `trigger()`/`clearErrors()` sequence.
  - **Real cause:** logging `TermsStep`'s own renders showed
    `formState.errors.acceptTerms` was *empty* on `TermsStep`'s first two
    renders after mounting, then became populated by the third render —
    i.e., something *after* `TermsStep` first mounts (most likely
    `Controller` registering the newly-mounted `acceptTerms` field, which
    prompts react-hook-form to re-derive form-wide validity) triggers a
    fresh resolver-based validation pass. That fresh pass is not wrong: it
    finds `acceptTerms` genuinely `false` against the live schema, because
    it is — the user hasn't checked it yet. No amount of clearing
    `formState.errors` after `trigger()` can survive a later, legitimate
    revalidation the app didn't ask for and can't prevent.
  - **Fix:** stop trying to keep `formState.errors` itself clean, and
    instead gate error *display* on whether the user has actually attempted
    the step currently on screen. `useSignUpForm` tracks a `stepAttempted`
    boolean, reset to `false` on every step change (`goNext` success or
    `goBack`) and set to `true` only when `goNext`'s `trigger()` fails for
    the current step, or when `onSubmit`'s `handleSubmit` invalid-callback
    fires (step 3's submit-with-unchecked-box case). Each step component
    takes a `showErrors: boolean` prop (`SignUpModal` passes
    `stepAttempted`) and every `fieldState.error` read — both the
    `border-red-500` conditional and the message paragraph — becomes
    `showErrors && fieldState.error`. This matches the original hand-rolled
    behavior exactly: `validateStepN()` only ever populated `errors` when
    the user tried to leave/submit that specific step, never on arrival.
    It also sidesteps the RHF mechanism entirely rather than depending on
    understanding it fully — the display gate holds regardless of *why* or
    *when* react-hook-form decides to revalidate in the background.
  - Neither bug was caught by Task 8's automated tests, because none of
    the three regression tests asserts on error *absence* on a step the
    user hasn't tried to submit yet — they're scoped to the three
    mechanical risks in their own name (`shouldUnregister`, native
    `<select>`, checkbox coercion), not this class of bug. Worth a 4th test
    if this component sees more churn (see "Regression tests" section).
- **Phantom native form submission on the step-2→3 transition — found
  while live-verifying the `stepAttempted` fix above, and more serious than
  the display bug it was found alongside.** With the `stepAttempted` fix
  correctly implemented, "You must accept the terms" could still appear
  immediately on arrival at step 3 under a REAL (focused) click on "Next" —
  a scripted, unfocused `.click()` never reproduced it, a real click did,
  2/2. Cause: `SignUpModal.tsx`'s nav-button JSX renders either a
  `type="button"` (Next, steps 1–2) or `type="submit"` (Create Account,
  step 3) `<Button>` at the *same* position, with no `key` distinguishing
  them. React reconciles this as "the same element, changed props" and
  mutates the existing DOM node's `type` attribute in place rather than
  removing and replacing it. Because that DOM node was the actual target of
  the user's click and is still focused, and React's state update
  (`currentStep` advancing) commits synchronously within the same click's
  event handling, the node's `type` flips from `button` to `submit` *before*
  the browser evaluates the click's default action — so the browser submits
  the form the user never clicked submit on. `handleSubmit`'s
  invalid-callback then legitimately fires (step 3 is genuinely incomplete)
  and sets `stepAttempted = true`, reintroducing the exact symptom the
  display-gating fix exists to prevent — but this time because a real
  submit attempt happened, not because of stale background validation.
  **Fix:** give the two buttons distinct `key`s (e.g. `key="next"` /
  `key="submit"`) so React unmounts the old node and mounts a fresh one on
  the type change, instead of mutating an existing, still-focused node's
  `type` attribute in place — the standard fix for this class of "ghost
  submit" bug. See `components/auth/SignUpModal.tsx`.

### `lib/password-strength.ts`

`getPasswordStrength(password: string): number` and
`getPasswordStrengthLabel(strength: number): { label: string; color: string }`
— extracted verbatim, no behavior change.

### `components/auth/SignUpModal.tsx` (after)

Shrinks to: `Dialog` + step-indicator header (unchanged JSX) +
`<Form {...form}><form onSubmit={onSubmit}>` wrapping whichever step is
active by `currentStep` + the submit-level error `Alert` + nav buttons
(`Back`/`Next`/`Create Account`) calling `goBack`/`goNext`, matching today's
button placement and disabled/loading states exactly. `handleOpenChange`
calls `resetForm()` on close, same as today.

### File-by-file changes

| File | Change |
|---|---|
| `lib/validation.ts` | Add `signUpFormSchema` + `SignUpFormValues` type, next to `signUpSchema`. |
| `lib/password-strength.ts` (new) | `getPasswordStrength`, `getPasswordStrengthLabel`, extracted verbatim. |
| `hooks/useSignUpForm.ts` (new) | Hook described above, including `mapSignUpError`. |
| `components/auth/signup-steps/BasicInfoStep.tsx` (new) | Step 1 fields. |
| `components/auth/signup-steps/SecurityStep.tsx` (new) | Step 2 fields + password meter + visibility toggles. |
| `components/auth/signup-steps/TermsStep.tsx` (new) | Step 3 field + Terms/Privacy modal toggles. |
| `components/auth/SignUpModal.tsx` | Rewritten to compose the hook + step components; drops all inline `useState`/`validateStepN`/`getPasswordStrength*`. |
| `components/auth/SignUpModal.test.tsx` (new) | Three regression tests: Back-navigation data persistence, native `<select>` for `occupationStatus`, checkbox boolean coercion. |

### Regression tests (closes the three implementation-risk gaps)

`shouldUnregister`, the native-`<select>` decision, and the checkbox
coercion are only actually exercised when real DOM fields mount/unmount as
steps swap — a hook-only test wouldn't touch any of that, since `FormField`/
`Controller` (where fields actually register) live in the step components,
not in `useSignUpForm` itself. So the regression guard has to be a full
component render, not an isolated hook test. The repo already has
`vitest` + `@testing-library/react` + `@testing-library/jest-dom` installed
(pattern: `components/home/HomeInteractiveShell.test.tsx`) — no new
dependency needed. `@testing-library/user-event` is **not** installed, so
this uses `fireEvent` (already available), matching what's actually in the
repo rather than adding a package for one test file.

**`components/auth/SignUpModal.test.tsx`** (new), mocking `useAuth` the same
way `HomeInteractiveShell.test.tsx` does:

1. Render the modal open, fill step 1 (`firstName`, `lastName`, `email`) via
   `fireEvent.change`, click "Next" → assert a step-2-only field (e.g. the
   password label) is now visible.
2. Click "Back" → assert the `firstName` input's value is still `"..."` as
   typed. **This is the direct regression guard for `shouldUnregister`** —
   if it were ever left at RHF's implicit default and that default changed,
   or someone dropped the option "as unnecessary," this test fails instead
   of the bug shipping silently.
3. `screen.getByLabelText(/current status/i).tagName === 'SELECT'` —
   **direct regression guard for the native-`<select>` decision.** If someone
   swaps in the styled Radix `Select`, this assertion fails immediately
   (Radix renders a `<button>` + listbox, not a `<select>`).
4. Fill steps 1–2 with valid data, advance to step 3, check the terms
   checkbox via `fireEvent.click`, submit, and assert the mocked `signUp` was
   called once. **Regression guard for the checkbox coercion** — if
   `onCheckedChange` passed through Radix's raw `boolean | "indeterminate"`
   instead of coercing to a plain `boolean`, `acceptTerms` would fail the
   schema's `.refine((v) => v === true)` and `signUp` would never be called.

This directly closes gap #4 for the three implementation details this
review pass surfaced, rather than just documenting them as tradeoffs it
hopes an implementer gets right.

### Out of scope

- Changing the server-side `signUpSchema` or the signup API route — this
  ticket is frontend-only.
- `SignInModal.tsx` / `ForgotPasswordModal.tsx` — not wizards, not part of
  this ticket. They're natural next candidates for the same `components/ui/
  form.tsx` infra later, but converting them isn't in scope here.
- Adding new validation rules beyond what already exists (e.g. no new
  password complexity requirements) — purely a structural refactor.
- **Broader automated coverage beyond the three regression guards above**
  (e.g. testing every validation message, the password-strength meter's
  scoring, or `mapSignUpError`'s substring-matching branches). The ticket's
  DoD only requires manual browser verification; the three tests above exist
  specifically because they're the only ones that would silently reintroduce
  a bug this review pass already found and fixed. A fuller suite is a
  reasonable follow-up if `SignUpModal` sees more churn, but isn't needed to
  make this refactor itself safe.

## Verification plan

- `pnpm lint && pnpm type-check`
- `pnpm test` — runs the new `SignUpModal.test.tsx` regression tests plus the
  full existing suite (confirms nothing else broke; note this repo's actual
  script is `test`, not `test:unit`/`test:e2e`)
- Manual run through `pnpm dev`: open sign-up, verify step 1→2→3 validation
  (required fields, email format, password rules, zip format, occupation
  required, terms required), back navigation preserves entered data, password
  strength meter updates live, show/hide password toggles work, Terms/Privacy
  sub-modals open, submit success closes modal + fires `onSuccess`, submit
  failure (duplicate email) shows the mapped error message, closing the modal
  mid-flow resets it on reopen.

## Lesson to save (per ticket DoD)

`useSignUpForm` is the reusable pattern for multi-step forms in this repo:
one `useForm()` + one zod schema for the whole form (not one per step),
`form.trigger([...fieldsForThisStep])` to gate step advancement, and step
components as pure presentational units reading `useFormContext()` rather
than receiving `control` as a prop. The next multi-step form should start from
this hook's shape instead of hand-rolling per-step `useState` + manual
validators again.
