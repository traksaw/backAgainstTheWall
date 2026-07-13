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
