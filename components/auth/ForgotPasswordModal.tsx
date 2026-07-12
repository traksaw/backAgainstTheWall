"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignIn: () => void
}

export function ForgotPasswordModal({ open, onOpenChange, onSwitchToSignIn }: ForgotPasswordModalProps) {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!email) {
        throw new Error("Email is required")
      }

      await requestPasswordReset(email)
      // WAS-32: always show the same success state regardless of whether
      // the email is registered - the server already returns a generic
      // response, this just reinforces it on the client.
      setSubmitted(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEmail("")
      setError("")
      setSubmitted(false)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-md bg-white text-gray-900 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-gray-900">Reset Password</DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            Enter your email and we'll send you a reset link
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="mt-6 space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              If an account exists for that email, a reset link has been sent.
            </div>
            <Button
              type="button"
              onClick={onSwitchToSignIn}
              className="w-full bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold py-3 rounded-lg transition-all duration-300"
            >
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38]"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold py-3 rounded-lg transition-all duration-300"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Remembered your password?{" "}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="text-[#B95D38] hover:text-[#B95D38]/90 font-medium"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
