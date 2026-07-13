# WAS-13: Refactor SignUpModal onto shared form infra Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace `components/auth/SignUpModal.tsx`'s hand-rolled per-field `useState`/`validateStepN()` wizard with `react-hook-form` + `zod`, using the existing (currently-unused) `components/ui/form.tsx` shadcn wrapper — same 3-step flow, same visuals, no behavior change from a user's perspective.

**Architecture:** One `zod` schema (`signUpFormSchema` in `lib/validation.ts`, extending the existing server-side `signUpSchema`) backs a single `useForm()` instance, owned by a new `useSignUpForm` hook (`hooks/useSignUpForm.ts`) that also owns step navigation (`form.trigger()`-gated) and submission. Three presentational step components (`components/auth/signup-steps/`) read form state via `useFormContext()`. `SignUpModal.tsx` shrinks to composing the hook + steps inside `<Form {...form}>`.

**Tech Stack:** Next.js, React, `react-hook-form` (already a dependency), `@hookform/resolvers/zod` (already a dependency), `zod` (already a dependency), `vitest` + `@testing-library/react` for the regression test.

**Design doc:** `docs/superpowers/specs/2026-07-12-was-13-signup-modal-refactor-design.md` — read this first for the full rationale, especially the "RHF gotchas this design depends on" section (covers `shouldUnregister`, the native-`<select>` decision, and checkbox boolean coercion — all three are load-bearing for tasks 3–7 below).

---

## Before you start

Read `components/auth/SignUpModal.tsx` (the current 658-line file) in full — every task below reproduces a specific piece of it. Also skim `components/ui/form.tsx` (the shared `FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` primitives you'll be using) and `lib/validation.ts` (the existing `signUpSchema` you're extending).

Note: `FormMessage` (from `components/ui/form.tsx`) is **not** used for error text in this refactor — its default rendering doesn't support the `AlertCircle` icon + `text-red-500 text-xs` styling the current UI uses. Instead, each field's `render` prop destructures `fieldState` and renders a matching custom `<p>` manually. This is called out per-task below; don't "simplify" it to `<FormMessage />` or you'll introduce a visual diff.

---

### Task 1: Extract password-strength utility

**Files:**
- Create: `lib/password-strength.ts`

No dedicated test for this task — it's a verbatim extraction of existing, already-working logic (see design doc's "Regression tests" section for why test scope stops at the 3 tests in Task 8).

**Step 1: Create the file**

```ts
// lib/password-strength.ts

export function getPasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z\d]/.test(password)) strength++
  return strength
}

export function getPasswordStrengthLabel(strength: number): { label: string; color: string } {
  switch (strength) {
    case 0:
    case 1:
      return { label: "Weak", color: "text-red-500" }
    case 2:
      return { label: "Fair", color: "text-orange-500" }
    case 3:
      return { label: "Good", color: "text-yellow-500" }
    case 4:
    case 5:
      return { label: "Strong", color: "text-green-500" }
    default:
      return { label: "Weak", color: "text-red-500" }
  }
}
```

**Step 2: Typecheck**

Run: `pnpm type-check`
Expected: no errors related to this file.

**Step 3: Commit**

```bash
git add lib/password-strength.ts
git commit -m "refactor(auth): extract password-strength utility"
```

---

### Task 2: Add `signUpFormSchema` to `lib/validation.ts`

**Files:**
- Modify: `lib/validation.ts`

**Step 1: Add the schema right after the existing `signUpSchema` export**

Open `lib/validation.ts` and insert this immediately after the `signUpSchema` block (before `requestResetSchema`):

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

Every field is defined fresh in `.extend()` — do NOT chain new checks onto
`signUpSchema.shape.X` (e.g. `signUpSchema.shape.firstName.min(2, ...)`).
`signUpSchema`'s fields already carry an earlier, unlabeled `min(1)` (or
bare `.email()`); a later chained check fires *after* that inherited one, so
for the exact empty/invalid case the new message exists to handle, the
inherited check fails first and its generic Zod message wins instead — the
intended message never surfaces (`@hookform/resolvers/zod` only shows the
first issue per field). `.omit({password: true})` still ties this schema's
keys to `signUpSchema` (a compile error if a key ever goes missing), which
is the reuse that matters here — it's just not reuse of the validators
themselves. See the design doc's "Why not chain onto `signUpSchema.shape.X`"
note for the full empirical trace.

**Step 2: Typecheck**

Run: `pnpm type-check`
Expected: no errors. If you see an error about `.omit`/`.extend`/`.shape` not existing, confirm `signUpSchema` above it is still `z.object({...})` (not wrapped in `.refine()` itself — it isn't, today).

**Step 3: Commit**

```bash
git add lib/validation.ts
git commit -m "feat(auth): add signUpFormSchema extending signUpSchema for client-side sign-up validation"
```

---

### Task 3: Build `useSignUpForm` hook

**Files:**
- Create: `hooks/useSignUpForm.ts`

**Step 1: Create the file**

```ts
// hooks/useSignUpForm.ts
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/hooks/useAuth"
import { signUpFormSchema, type SignUpFormValues } from "@/lib/validation"

const STEP_FIELDS: Record<number, (keyof SignUpFormValues)[]> = {
  1: ["firstName", "lastName", "email"],
  2: ["password", "passwordConfirmation", "zip_code", "occupationStatus"],
  3: ["acceptTerms"],
}

function mapSignUpError(err: unknown): string {
  let errorMessage = "An unexpected error occurred during signup"

  if (err instanceof Error) {
    errorMessage = err.message
  } else if (typeof err === "string") {
    errorMessage = err
  } else if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    errorMessage = (err as { message: string }).message
  }

  const errorMsg = errorMessage.toLowerCase()
  if (errorMsg.includes("already registered") || errorMsg.includes("already exists")) {
    return "An account with this email already exists"
  }
  if (errorMsg.includes("invalid email")) {
    return "Please enter a valid email address"
  }
  if (errorMsg.includes("password")) {
    return "Password requirements not met"
  }
  return errorMessage
}

interface UseSignUpFormOptions {
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function useSignUpForm({ onOpenChange, onSuccess }: UseSignUpFormOptions) {
  const { signUp } = useAuth()
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    // Step components unmount/remount as currentStep changes. RHF's default
    // is already false, but it's pinned explicitly here so Back-navigation
    // data loss can't reappear as a silent side effect of a version bump or
    // a "cleanup." See design doc: "RHF gotchas this design depends on."
    shouldUnregister: false,
    defaultValues: {
      email: "",
      password: "",
      passwordConfirmation: "",
      firstName: "",
      lastName: "",
      zip_code: "",
      occupationStatus: "",
      acceptTerms: false,
    },
  })
  const [currentStep, setCurrentStep] = useState(1)
  const [submitError, setSubmitError] = useState("")
  const [loading, setLoading] = useState(false)

  const goNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[currentStep])
    if (valid) setCurrentStep((step) => step + 1)
  }

  const goBack = () => setCurrentStep((step) => Math.max(1, step - 1))

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
      setSubmitError(mapSignUpError(err))
    } finally {
      setLoading(false)
    }
  })

  return { form, currentStep, goNext, goBack, onSubmit, submitError, loading, resetForm }
}
```

**Step 2: Typecheck**

Run: `pnpm type-check`
Expected: no errors.

**Step 3: Commit**

```bash
git add hooks/useSignUpForm.ts
git commit -m "feat(auth): add useSignUpForm hook"
```

---

### Task 4: Build `BasicInfoStep` (wizard step 1)

**Files:**
- Create: `components/auth/signup-steps/BasicInfoStep.tsx`

**Step 1: Create the file**

```tsx
// components/auth/signup-steps/BasicInfoStep.tsx
"use client"

import { useFormContext } from "react-hook-form"
import { User, Mail, AlertCircle } from "lucide-react"
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { SignUpFormValues } from "@/lib/validation"

export function BasicInfoStep() {
  const { control } = useFormContext<SignUpFormValues>()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="firstName"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
                <User className="w-4 h-4 mr-1" />
                First Name
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="John"
                  className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] ${
                    fieldState.error ? "border-red-500" : ""
                  }`}
                />
              </FormControl>
              {fieldState.error && (
                <p className="text-red-500 text-xs flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {fieldState.error.message}
                </p>
              )}
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="lastName"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
                <User className="w-4 h-4 mr-1" />
                Last Name
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Doe"
                  className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] ${
                    fieldState.error ? "border-red-500" : ""
                  }`}
                />
              </FormControl>
              {fieldState.error && (
                <p className="text-red-500 text-xs flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {fieldState.error.message}
                </p>
              )}
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              Email Address
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                type="email"
                placeholder="john.doe@example.com"
                className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] ${
                  fieldState.error ? "border-red-500" : ""
                }`}
              />
            </FormControl>
            {fieldState.error && (
              <p className="text-red-500 text-xs flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {fieldState.error.message}
              </p>
            )}
          </FormItem>
        )}
      />
    </div>
  )
}
```

**Step 2: Typecheck**

Run: `pnpm type-check`
Expected: no errors.

**Step 3: Commit**

```bash
git add components/auth/signup-steps/BasicInfoStep.tsx
git commit -m "feat(auth): add BasicInfoStep sign-up wizard step"
```

---

### Task 5: Build `SecurityStep` (wizard step 2)

**Files:**
- Create: `components/auth/signup-steps/SecurityStep.tsx`

This is the step with the most moving parts: password show/hide toggles (local UI state, not form data), the password-strength meter, and the `occupationStatus` field — which **must stay a native `<select>`**, not the styled Radix `Select` from `components/ui/select.tsx` (see design doc gap #2).

**Step 1: Create the file**

```tsx
// components/auth/signup-steps/SecurityStep.tsx
"use client"

import { useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { Eye, EyeOff, AlertCircle, Lock, MapPin, Briefcase } from "lucide-react"
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { getPasswordStrength, getPasswordStrengthLabel } from "@/lib/password-strength"
import type { SignUpFormValues } from "@/lib/validation"

const OCCUPATION_OPTIONS = [
  "Working Professional",
  "Dedicated Student",
  "Retired",
  "Transitioning Between Opportunities",
  "Entrepreneur",
]

export function SecurityStep() {
  const { control } = useFormContext<SignUpFormValues>()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const password = useWatch({ control, name: "password" })
  const passwordStrength = getPasswordStrength(password || "")
  const passwordStrengthInfo = getPasswordStrengthLabel(passwordStrength)

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
              <Lock className="w-4 h-4 mr-1" />
              Password
            </FormLabel>
            <div className="relative">
              <FormControl>
                <Input
                  {...field}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] pr-10 ${
                    fieldState.error ? "border-red-500" : ""
                  }`}
                />
              </FormControl>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {field.value && (
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength <= 1
                        ? "bg-red-500 w-1/5"
                        : passwordStrength === 2
                          ? "bg-orange-500 w-2/5"
                          : passwordStrength === 3
                            ? "bg-yellow-500 w-3/5"
                            : "bg-green-500 w-full"
                    }`}
                  />
                </div>
                <span className={`text-xs font-medium ${passwordStrengthInfo.color}`}>
                  {passwordStrengthInfo.label}
                </span>
              </div>
            )}
            {fieldState.error && (
              <p className="text-red-500 text-xs flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {fieldState.error.message}
              </p>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="passwordConfirmation"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
              <Lock className="w-4 h-4 mr-1" />
              Confirm Password
            </FormLabel>
            <div className="relative">
              <FormControl>
                <Input
                  {...field}
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="Confirm your password"
                  className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] pr-10 ${
                    fieldState.error ? "border-red-500" : ""
                  }`}
                />
              </FormControl>
              <button
                type="button"
                onClick={() => setShowPasswordConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldState.error && (
              <p className="text-red-500 text-xs flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {fieldState.error.message}
              </p>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="zip_code"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Zip Code
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                type="text"
                placeholder="12345"
                maxLength={10}
                className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] ${
                  fieldState.error ? "border-red-500" : ""
                }`}
              />
            </FormControl>
            {fieldState.error && (
              <p className="text-red-500 text-xs flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {fieldState.error.message}
              </p>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="occupationStatus"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
              <Briefcase className="w-4 h-4 mr-1" />
              Current Status
            </FormLabel>
            <FormControl>
              {/* Native <select>, NOT components/ui/select.tsx — see design
                  doc gap #2. Swapping this changes the rendered markup and
                  will fail the SecurityStep test in Task 8. */}
              <select
                {...field}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#B95D38] focus:ring-[#B95D38] bg-white ${
                  fieldState.error ? "border-red-500" : ""
                }`}
              >
                <option value="">Select your current status</option>
                {OCCUPATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FormControl>
            {fieldState.error && (
              <p className="text-red-500 text-xs flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {fieldState.error.message}
              </p>
            )}
          </FormItem>
        )}
      />
    </div>
  )
}
```

**Step 2: Typecheck**

Run: `pnpm type-check`
Expected: no errors.

**Step 3: Commit**

```bash
git add components/auth/signup-steps/SecurityStep.tsx
git commit -m "feat(auth): add SecurityStep sign-up wizard step"
```

---

### Task 6: Build `TermsStep` (wizard step 3)

**Files:**
- Create: `components/auth/signup-steps/TermsStep.tsx`

The `acceptTerms` checkbox needs manual `checked`/`onCheckedChange` wiring (not `{...field}` spread) — see design doc gap #3: Radix's `onCheckedChange` returns `boolean | "indeterminate"`, but the schema field is a plain `boolean`.

**Step 1: Create the file**

```tsx
// components/auth/signup-steps/TermsStep.tsx
"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { AlertCircle } from "lucide-react"
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TermsModal } from "@/components/modals/TermsModal"
import { PrivacyModal } from "@/components/modals/PrivacyModal"
import type { SignUpFormValues } from "@/lib/validation"

export function TermsStep() {
  const { control } = useFormContext<SignUpFormValues>()
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
        <h3 className="font-semibold text-gray-900 mb-3">Terms and Conditions</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>1. Acceptance of Terms</strong></p>
          <p>By creating an account, you agree to these terms and conditions.</p>

          <p><strong>2. Data Collection and Use</strong></p>
          <p>
            We collect your personal information to provide personalized quiz results and film recommendations.
            Your data will not be shared with third parties without your consent.
          </p>

          <p><strong>3. Quiz Results</strong></p>
          <p>
            The financial archetype quiz is for educational and entertainment purposes. Results should not be
            considered professional financial advice.
          </p>

          <p><strong>4. Account Security</strong></p>
          <p>You are responsible for maintaining the security of your account credentials.</p>

          <p><strong>5. Content Usage</strong></p>
          <p>All film content and quiz materials are protected by copyright. Personal use only.</p>

          <p><strong>6. Privacy Policy</strong></p>
          <p>We respect your privacy. See our full Privacy Policy for details on data handling.</p>

          <p><strong>7. Changes to Terms</strong></p>
          <p>We may update these terms periodically. Continued use constitutes acceptance of changes.</p>
        </div>
      </div>

      <FormField
        control={control}
        name="acceptTerms"
        render={({ field, fieldState }) => (
          <FormItem>
            <div className="flex items-start space-x-3">
              <FormControl>
                <Checkbox
                  ref={field.ref}
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="mt-1"
                />
              </FormControl>
              <FormLabel className="text-sm text-gray-700 leading-relaxed">
                I have read and agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-[#B95D38] font-medium hover:underline"
                >
                  Terms and Conditions
                </button> and{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-[#B95D38] font-medium hover:underline"
                >
                  Privacy Policy
                </button>
              </FormLabel>
            </div>
            {fieldState.error && (
              <p className="text-red-500 text-xs flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {fieldState.error.message}
              </p>
            )}
          </FormItem>
        )}
      />

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Almost there!</strong> Once you create your account, you'll immediately take our financial
          personality quiz to discover your archetype.
        </AlertDescription>
      </Alert>

      <TermsModal open={showTermsModal} onOpenChange={setShowTermsModal} />
      <PrivacyModal open={showPrivacyModal} onOpenChange={setShowPrivacyModal} />
    </div>
  )
}
```

**Step 2: Typecheck**

Run: `pnpm type-check`
Expected: no errors.

**Step 3: Commit**

```bash
git add components/auth/signup-steps/TermsStep.tsx
git commit -m "feat(auth): add TermsStep sign-up wizard step"
```

---

### Task 7: Rewrite `SignUpModal.tsx` to compose the hook + steps

**Files:**
- Modify: `components/auth/SignUpModal.tsx` (full rewrite — replaces all 658 lines)

**Step 1: Replace the file's contents**

```tsx
// components/auth/SignUpModal.tsx
"use client"

import { CheckCircle, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Form } from "@/components/ui/form"
import { useSignUpForm } from "@/hooks/useSignUpForm"
import { BasicInfoStep } from "@/components/auth/signup-steps/BasicInfoStep"
import { SecurityStep } from "@/components/auth/signup-steps/SecurityStep"
import { TermsStep } from "@/components/auth/signup-steps/TermsStep"

interface SignUpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignIn: () => void
  onSuccess: () => void
}

export function SignUpModal({ open, onOpenChange, onSwitchToSignIn, onSuccess }: SignUpModalProps) {
  const { form, currentStep, goNext, goBack, onSubmit, submitError, loading, resetForm } = useSignUpForm({
    onOpenChange,
    onSuccess,
  })

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetForm()
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-md bg-white text-gray-900 border-0 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-gray-900">Create Your Account</DialogTitle>
          <div className="flex items-center justify-center space-x-2 mt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep ? "bg-[#B95D38] text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
                {step < 3 && <div className={`w-8 h-1 mx-2 ${step < currentStep ? "bg-[#B95D38]" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <DialogDescription className="text-center text-gray-600 mt-2">
            {currentStep === 1 && "Let's start with your basic information"}
            {currentStep === 2 && "Set up your account security"}
            {currentStep === 3 && "Review and accept our terms"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4 mt-6">
            {currentStep === 1 && <BasicInfoStep />}
            {currentStep === 2 && <SecurityStep />}
            {currentStep === 3 && <TermsStep />}

            {submitError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between pt-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="border-gray-300 text-gray-700 hover:bg-[#B95D38]/10 bg-transparent"
                >
                  Back
                </Button>
              )}

              <div className="flex-1" />

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={goNext}
                  className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold px-6"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold px-6"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              )}
            </div>

            <div className="text-center text-sm text-gray-600 pt-4 border-t">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="text-[#B95D38] hover:text-[#B95D38]/90 font-medium"
              >
                Sign In
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

Note: `TermsModal`/`PrivacyModal` moved from being siblings of `<DialogContent>` (their location in the old file) into `TermsStep` itself — they're only relevant on step 3, and Radix `Dialog.Content` always portals to `document.body` regardless of where it's mounted in the React tree, so this doesn't change any rendered DOM structure or visual behavior. It just means they're no longer mounted (harmlessly, always-closed) during steps 1–2.

**Step 2: Typecheck and lint**

Run: `pnpm type-check && pnpm lint`
Expected: no errors. If `lint` flags unused imports, double check you removed everything the old file used that's no longer needed (there should be nothing left to flag — every import above is used).

**Step 3: Commit**

```bash
git add components/auth/SignUpModal.tsx
git commit -m "refactor(auth): rewrite SignUpModal onto useSignUpForm + shared form infra"
```

---

### Task 8: Write the regression test suite

**Files:**
- Create: `components/auth/SignUpModal.test.tsx`

This is written *after* the implementation (Tasks 1–7), not before — the three things it guards (`shouldUnregister`, native `<select>`, checkbox coercion) are risks specific to the RHF/Radix architecture just built, not a pre-existing failing behavior. Writing it first against the old hand-rolled `useState` version would trivially pass without proving anything (the old code doesn't have this failure mode at all). See design doc "Regression tests" section. Run it once after writing — it should pass immediately, confirming Tasks 3–7 wired things up correctly.

**Step 1: Create the file**

```tsx
// components/auth/SignUpModal.test.tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SignUpModal } from "./SignUpModal"

const signUp = vi.fn().mockResolvedValue(undefined)

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ signUp }),
}))

function renderModal() {
  return render(
    <SignUpModal open={true} onOpenChange={vi.fn()} onSwitchToSignIn={vi.fn()} onSuccess={vi.fn()} />
  )
}

function fillStep1() {
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Jane" } })
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Doe" } })
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "jane@example.com" } })
  fireEvent.click(screen.getByRole("button", { name: /next/i }))
}

describe("SignUpModal", () => {
  it("preserves step 1 field values after navigating to step 2 and back (shouldUnregister regression guard)", async () => {
    renderModal()
    fillStep1()

    expect(await screen.findByLabelText(/^password$/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /back/i }))

    expect(await screen.findByLabelText(/first name/i)).toHaveValue("Jane")
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Doe")
    expect(screen.getByLabelText(/email address/i)).toHaveValue("jane@example.com")
  })

  it("renders occupation status as a native <select> element (native-select regression guard)", async () => {
    renderModal()
    fillStep1()

    const occupationField = await screen.findByLabelText(/current status/i)
    expect(occupationField.tagName).toBe("SELECT")
  })

  it("submits successfully when the terms checkbox is checked (checkbox-coercion regression guard)", async () => {
    renderModal()
    fillStep1()

    fireEvent.change(await screen.findByLabelText(/^password$/i), { target: { value: "password1" } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password1" } })
    fireEvent.change(screen.getByLabelText(/zip code/i), { target: { value: "12345" } })
    fireEvent.change(screen.getByLabelText(/current status/i), { target: { value: "Entrepreneur" } })
    fireEvent.click(screen.getByRole("button", { name: /next/i }))

    const checkbox = await screen.findByRole("checkbox")
    fireEvent.click(checkbox)

    fireEvent.click(screen.getByRole("button", { name: /create account/i }))

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1))
  })
})
```

**Step 2: Run the tests**

Run: `pnpm test -- SignUpModal`
Expected: `3 passed`. If any fail:
- Test 1 failing → check `shouldUnregister: false` is actually set in `hooks/useSignUpForm.ts` (Task 3).
- Test 2 failing (`tagName` isn't `SELECT`) → check `SecurityStep.tsx` still renders a native `<select>`, not `components/ui/select.tsx`'s `Select`.
- Test 3 failing (`signUp` never called) → check `TermsStep.tsx`'s `onCheckedChange={(checked) => field.onChange(checked === true)}` wiring, and that all step 1–2 values used above (`password1`, `12345`, `Entrepreneur`) actually satisfy `signUpFormSchema` from Task 2.

**Step 3: Commit**

```bash
git add components/auth/SignUpModal.test.tsx
git commit -m "test(auth): add SignUpModal regression tests for RHF step-navigation, native select, checkbox coercion"
```

---

### Task 9: Full verification pass

**Step 1: Lint, typecheck, full test suite**

```bash
pnpm lint
pnpm type-check
pnpm test
```

Expected: all three pass clean, including the full existing suite (not just the new file) — this confirms nothing else in the app broke.

**Step 2: Manual browser verification**

```bash
pnpm dev
```

Open the app, trigger the sign-up modal, and walk through:

- [ ] Step 1 → Step 2 → Step 3 → Step 2 → Step 1 navigation preserves all entered data
- [ ] Step 1 validation: empty first/last name, name < 2 chars, empty/invalid email all show errors and block "Next"
- [ ] Step 2 validation: password < 8 chars, password missing letter or number, mismatched confirmation, invalid zip format, no occupation selected all show errors and block "Next"
- [ ] Password strength meter updates live as you type, matches today's color/label thresholds
- [ ] Show/hide toggle works independently on both password fields
- [ ] Step 3: unchecked terms blocks submit with the terms error; "Terms and Conditions" / "Privacy Policy" links open their respective modals
- [ ] Submitting a valid form: modal closes, `onSuccess` fires (quiz launches), form is reset
- [ ] Submitting with a duplicate email: shows "An account with this email already exists" without closing the modal
- [ ] Closing the modal mid-flow (via backdrop or X) and reopening starts fresh at step 1 with empty fields

**Step 3: Fix anything broken, then proceed** — do not commit a broken state; if the manual pass surfaces an issue, fix it in the relevant task's file and amend forward with a new commit (don't rewrite already-pushed history if this branch has been shared).

---

### Task 10: Save the lesson (per ticket DoD)

The ticket's Definition of Done requires saving the `useSignUpForm` pattern so the next multi-step form reuses it. This is a memory-write action (Claude's own persistent memory), not a code change:

Save a `project`-type memory (or update existing project memory index) capturing: `useSignUpForm` in `hooks/useSignUpForm.ts` is the reusable pattern for multi-step forms in this repo — one `useForm()` + one zod schema for the whole form, `form.trigger([...stepFields])` to gate step advancement, step components reading `useFormContext()` rather than receiving `control` as a prop. Link it from `MEMORY.md`.

---

### Task 11: Open the PR

**Do not push or open the PR without explicit confirmation** — per standing instructions, pushing to GitHub requires the user's go-ahead each time, not just once.

When ready:
1. Push the branch: `git push -u origin waskarpaulino/was-13-frontend-refactor-signupmodal-onto-shared-form-infra`
2. Open the PR with a body that includes `Closes WAS-13` (per ticket DoD), summarizing the refactor and linking `docs/superpowers/specs/2026-07-12-was-13-signup-modal-refactor-design.md`.

---

## Summary of files touched

| File | Status |
|---|---|
| `lib/password-strength.ts` | new |
| `lib/validation.ts` | modified (add `signUpFormSchema`) |
| `hooks/useSignUpForm.ts` | new |
| `components/auth/signup-steps/BasicInfoStep.tsx` | new |
| `components/auth/signup-steps/SecurityStep.tsx` | new |
| `components/auth/signup-steps/TermsStep.tsx` | new |
| `components/auth/SignUpModal.tsx` | rewritten |
| `components/auth/SignUpModal.test.tsx` | new |
