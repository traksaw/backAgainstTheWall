"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SignInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignUp: () => void
}

export function SignInModal({ open, onOpenChange, onSwitchToSignUp }: SignInModalProps) {
  const { signIn } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log("Starting signin process...")

      // Validate form data
      if (!formData.email || !formData.password) {
        throw new Error("Email and password are required")
      }

      await signIn(formData)

      console.log("Signin completed successfully")

      // Close modal
      onOpenChange(false)

      // Reset form
      setFormData({
        email: "",
        password: "",
      })
      setError("")
    } catch (error) {
      console.error("Signin failed in component:", {
        error,
        errorType: typeof error,
        message: (error as any)?.message,
        name: (error as any)?.name,
        stack: (error as any)?.stack,
      })

      // Set user-friendly error message
      let errorMessage = "An unexpected error occurred during sign in"

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "string") {
        errorMessage = error
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = (error as any).message
      }

      // Handle specific Supabase errors
      const errorMsg = errorMessage.toLowerCase()
      if (errorMsg.includes("invalid login credentials") || errorMsg.includes("invalid email or password")) {
        errorMessage = "Invalid email or password"
      } else if (errorMsg.includes("email not confirmed")) {
        errorMessage = "Please check your email and confirm your account"
      } else if (errorMsg.includes("too many requests")) {
        errorMessage = "Too many attempts. Please try again later"
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Reset form when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData({
        email: "",
        password: "",
      })
      setError("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-white text-gray-900 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-gray-900">Welcome Back</DialogTitle>
          <p className="text-center text-gray-600 mt-2">Sign in to continue your journey</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <Input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            required
            className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38]"
          />

          <Input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
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
            {loading ? "Signing In..." : "Sign In"}
          </Button>

          <div className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="text-[#B95D38] hover:text-[#B95D38]/90 font-medium"
            >
              Sign Up
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
