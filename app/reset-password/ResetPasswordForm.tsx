"use client"

import type React from "react"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { resetPassword } = useAuth()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      await resetPassword(token as string, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Invalid reset link</h1>
          <p className="text-gray-600">This password reset link is missing a token.</p>
          <Link href="/" className="text-[#B95D38] hover:text-[#B95D38]/90 font-medium">
            Return home
          </Link>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Password updated</h1>
          <p className="text-gray-600">You can now sign in with your new password.</p>
          <Link href="/" className="text-[#B95D38] hover:text-[#B95D38]/90 font-medium">
            Return home to sign in
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Set a new password</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38]"
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </main>
  )
}
