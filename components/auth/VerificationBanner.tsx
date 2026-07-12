"use client"

import { useState } from "react"

interface VerificationBannerProps {
  email: string
  onResend: (email: string) => Promise<void>
}

export function VerificationBanner({ email, onResend }: VerificationBannerProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle")

  const handleResend = async () => {
    setStatus("sending")
    try {
      await onResend(email)
      setStatus("sent")
    } catch {
      setStatus("idle")
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm px-4 py-2 text-center">
      {status === "sent" ? (
        "Verification email sent - check your inbox."
      ) : (
        <>
          Please verify your email address.{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={status === "sending"}
            className="underline font-medium hover:text-amber-900"
          >
            {status === "sending" ? "Sending..." : "Resend verification email"}
          </button>
        </>
      )}
    </div>
  )
}
