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
- No existing test or e2e spec covers `SignUpModal`'s UI (only
  `app/api/auth/signup/route.test.ts`, which tests the API route and is
  untouched by this ticket). Verification is manual-in-browser per the DoD.
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

Reuses `signUpSchema`'s field validators (not a parallel hand-typed copy) via
`.shape`, overrides the fields that need client-only strictness, adds the two
UI-only fields, and cross-validates password match:

```ts
export const signUpFormSchema = signUpSchema
  .omit({ password: true })
  .extend({
    firstName: signUpSchema.shape.firstName.min(2, "First name must be at least 2 characters"),
    lastName: signUpSchema.shape.lastName.min(2, "Last name must be at least 2 characters"),
    zip_code: signUpSchema.shape.zip_code.regex(
      /^\d{5}(-\d{4})?$/,
      "Please enter a valid zip code (e.g., 12345 or 12345-6789)"
    ),
    password: z
      .string()
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

`occupationStatus` and `email` reuse `signUpSchema.shape` unchanged (already
`min(1)` / `.email()`, matching current client behavior exactly).

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
  const [submitError, setSubmitError] = useState("")
  const [loading, setLoading] = useState(false)

  const goNext = async () => {
    if (await form.trigger(STEP_FIELDS[currentStep])) setCurrentStep((s) => s + 1)
  }
  const goBack = () => setCurrentStep((s) => Math.max(1, s - 1))

  const resetForm = () => {
    form.reset()
    setCurrentStep(1)
    setSubmitError("")
  }

  const onSubmit = form.handleSubmit(async (values) => {
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
  })

  return { form, currentStep, goNext, goBack, onSubmit, submitError, loading, resetForm }
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

### Out of scope

- Changing the server-side `signUpSchema` or the signup API route — this
  ticket is frontend-only.
- `SignInModal.tsx` / `ForgotPasswordModal.tsx` — not wizards, not part of
  this ticket. They're natural next candidates for the same `components/ui/
  form.tsx` infra later, but converting them isn't in scope here.
- Adding new validation rules beyond what already exists (e.g. no new
  password complexity requirements) — purely a structural refactor.
- **Automated UI test coverage for the sign-up flow.** The ticket's DoD only
  requires manual browser verification, and no test file exists today to
  extend. This is a deliberate, called-out tradeoff, not an oversight: an
  auth-adjacent flow with zero regression coverage is a real gap, but adding
  a first component/e2e test for it is materially more scope than "refactor
  onto existing infra." Flagged here so it's a conscious choice rather than
  something that quietly fell out of scope — worth a follow-up ticket if
  `SignUpModal` sees more churn.

## Verification plan

- `pnpm lint:fix && pnpm typecheck`
- `pnpm test:unit` (no existing SignUpModal-specific suite; confirms nothing
  else broke)
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
