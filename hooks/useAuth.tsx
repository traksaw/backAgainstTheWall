"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import type { IUser } from "@/models/User"

interface AuthContextType {
  user: IUser | null
  profile: IUser | null
  session: null
  loading: boolean
  isHydrated: boolean
  signUp: (data: any) => Promise<void>
  signIn: (data: any) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<IUser>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null)
  const [profile, setProfile] = useState<IUser | null>(null)
  const [session, setSession] = useState<null>(null)
  const [loading, setLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  // ✅ Extract fetchCurrentUser so we can reuse it
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me")
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
      console.error("Failed to fetch current user:", err)
      setUser(null)
      setProfile(null)
      return null
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true)
      await fetchCurrentUser()
      setIsHydrated(true)
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const loadUserProfile = async (user: IUser) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${user._id}`)
      if (!res.ok) throw new Error("Failed to load user profile")

      const profileData = await res.json()
      setProfile(profileData)
    } catch (err) {
      console.error("Error loading user profile:", err)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (data: any) => {
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

      // ✅ After successful signup, fetch the current user to get the latest state
      const userData = await fetchCurrentUser()
      if (!userData) {
        throw new Error("Failed to authenticate after signup")
      }

      console.log("Signup successful, user data:", userData)
    } catch (err) {
      console.error("Signup error:", err)
      throw err // Re-throw so the component can handle it
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (data: any) => {
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

      console.log("Signin successful, user data:", userData)
    } catch (err) {
      console.error("Signin error:", err)
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
      console.error("Sign-out failed:", error)
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
      console.error("Update profile failed:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isHydrated,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  }

  if (!isHydrated) {
    return <div className="w-full h-screen flex items-center justify-center text-xl">Loading...</div>
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