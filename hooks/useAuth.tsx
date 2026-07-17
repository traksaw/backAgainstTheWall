"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import type { IUser } from "@/models/User"
import type { SignUpData } from "@/lib/auth"
import type { SignInFormValues } from "@/lib/validation"
import { logger } from "@/lib/logger"

interface AuthContextType {
  user: IUser | null
  profile: IUser | null
  session: null
  loading: boolean
  signUp: (data: SignUpData) => Promise<void>
  signIn: (data: SignInFormValues) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<IUser>) => Promise<void>
  refreshProfile: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null)
  const [profile, setProfile] = useState<IUser | null>(null)
  const [session, setSession] = useState<null>(null)
  const [loading, setLoading] = useState(true)

  // ✅ Extract fetchCurrentUser so we can reuse it
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (!res.ok) { /* show signed-out UI */ }
      if (res.ok) {
        const userData = await res.json()
        setUser(userData)
        setProfile(userData)
        return userData
      } else {
        // Clear user data if not authenticated
        setUser(null)
        setProfile(null)
        return null
      }

    } catch (err) {
      logger.error("Failed to fetch current user:", err)
      setUser(null)
      setProfile(null)
      return null
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      await fetchCurrentUser();
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const loadUserProfile = async (user: IUser) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${user._id}`)
      if (!res.ok) throw new Error("Failed to load user profile")

      const profileData = await res.json()
      setProfile(profileData)
    } catch (err) {
      logger.error("Error loading user profile:", err)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (data: SignUpData) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const responseData = await res.json()
      
      if (!res.ok) {
        throw new Error(responseData.error || "Signup failed")
      }

      // After successful signup, fetch the current user to get the latest state
      const userData = await fetchCurrentUser()
      if (!userData) {
        throw new Error("Failed to authenticate after signup")
      }
    } catch (err) {
      logger.error("Signup error:", err)
      throw err // Re-throw so the component can handle it
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (data: SignInFormValues) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const responseData = await res.json()
      
      if (!res.ok) {
        throw new Error(responseData.error || "Signin failed")
      }

      // ✅ After successful signin, fetch the current user
      const userData = await fetchCurrentUser()
      if (!userData) {
        throw new Error("Failed to authenticate after signin")
      }

    } catch (err) {
      // SignInModal already reports this to Sentry via logger.error once it
      // catches the rethrow below - logging it again here would double-count
      // every failed signin, including routine wrong-password attempts.
      logger.warn("Signin error:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/signout", {
        method: "POST",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Sign out failed")
      }

      setUser(null)
      setProfile(null)
      setSession(null)
    } catch (error) {
      logger.error("Sign-out failed:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (!user) return
    await loadUserProfile(user)
  }

  const updateProfile = async (updates: Partial<IUser>) => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Update failed")
      }

      const updatedUser = await res.json()
      setUser(updatedUser)
      setProfile(updatedUser)
    } catch (error) {
      logger.error("Update profile failed:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const requestPasswordReset = async (email: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to request password reset")
      }
    } catch (err) {
      logger.error("Request password reset error:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (token: string, password: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to reset password")
      }
    } catch (err) {
      logger.error("Reset password error:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const verifyEmail = async (token: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to verify email")
      }

      // Refresh so the rest of the app sees the updated emailVerified status
      await fetchCurrentUser()
    } catch (err) {
      logger.error("Verify email error:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const resendVerification = async (email: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to resend verification email")
      }
    } catch (err) {
      logger.error("Resend verification error:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerification,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}