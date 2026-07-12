"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Status = "verifying" | "success" | "error"

export function VerifyEmailStatus() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { verifyEmail, resendVerification } = useAuth()

  const [status, setStatus] = useState<Status>("verifying")
  const [errorMessage, setErrorMessage] = useState("")
  const [resendEmail, setResendEmail] = useState("")
  const [resendSent, setResendSent] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setErrorMessage("This verification link is missing a token.")
      return
    }

    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error")
        setErrorMessage(err instanceof Error ? err.message : "Failed to verify email")
      })
    // Only run once on mount - re-running on every `verifyEmail` identity
    // change would re-submit the (now consumed) token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await resendVerification(resendEmail)
    } finally {
      // WAS-32: same generic response regardless of outcome (anti-enumeration)
      setResendSent(true)
    }
  }

  if (status === "verifying") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-4">
        <p className="text-gray-600">Verifying your email...</p>
      </main>
    )
  }

  if (status === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Email verified</h1>
          <p className="text-gray-600">Your email address has been verified.</p>
          <Link href="/" className="text-[#B95D38] hover:text-[#B95D38]/90 font-medium">
            Return home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Verification failed</h1>
        <p className="text-gray-600">{errorMessage}</p>

        {resendSent ? (
          <p className="text-sm text-gray-600">
            If an account exists for that email, a new verification link has been sent.
          </p>
        ) : (
          <form onSubmit={handleResend} className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              required
              className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38]"
            />
            <Button
              type="submit"
              className="w-full bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold py-3 rounded-lg transition-all duration-300"
            >
              Resend verification email
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
