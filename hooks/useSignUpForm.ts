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
  // True once the user has actually tried to leave/submit the step
  // currently on screen (Next failed validation, or Create Account was
  // clicked with an invalid step 3). Error display in each step component
  // is gated on this, NOT on formState.errors directly — see design doc's
  // "Premature step-3 error" note for why: react-hook-form revalidates the
  // whole schema in the background whenever a new field registers (e.g.
  // TermsStep mounting), which legitimately finds not-yet-visited fields
  // like acceptTerms invalid. That revalidation can't be prevented or
  // reliably cleared after the fact, so display is gated at the step level
  // instead of trying to keep formState.errors itself free of stale data.
  const [stepAttempted, setStepAttempted] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [loading, setLoading] = useState(false)

  const goNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[currentStep])
    if (valid) {
      setStepAttempted(false)
      setCurrentStep((step) => step + 1)
    } else {
      setStepAttempted(true)
    }
  }

  const goBack = () => {
    setStepAttempted(false)
    setCurrentStep((step) => Math.max(1, step - 1))
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
        setSubmitError(mapSignUpError(err))
      } finally {
        setLoading(false)
      }
    },
    () => setStepAttempted(true)
  )

  return { form, currentStep, stepAttempted, goNext, goBack, onSubmit, submitError, loading, resetForm }
}
