"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import type { IUser } from "@/models/User"
import { set } from "mongoose"

interface AuthContextType {
  user: IUser | null
  profile: IUser | null
  session: null
  loading: boolean
  isHydrated: boolean
  // databaseStatus: "checking" | "ready" | "error" | "setup-required"
  signUp: (data: any) => Promise<void>
  signIn: (data: any) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<IUser>) => Promise<void>
  refreshProfile: () => Promise<void>
  // checkDatabaseSetup: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null)
  const [profile, setProfile] = useState<IUser | null>(null)
  const [session, setSession] = useState<null>(null)
  const [loading, setLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  // const [databaseStatus, setDatabaseStatus] = useState<"checking" | "ready" | "error" | "setup-required">("checking")

 useEffect(() => {
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me") // or your session endpoint
      if (res.ok) {
        const user = await res.json()
        setUser(user)
        setProfile(user)
      }
    } catch (err) {
      console.error("Failed to fetch current user:", err)
    } finally {
      setIsHydrated(true)
      setLoading(false)
    }
  }

  fetchCurrentUser()
}, [])


  

  const loadUserProfile = async (user: IUser) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${user.userId}`)
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

      const user = await res.json()
      if (!res.ok) throw new Error(user.error || "Signup failed")

      setUser(user)
      setProfile(user)
    } catch (err) {
      console.error("Signup error:", err)
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

      const user = await res.json()
      if (!res.ok) throw new Error(user.error || "Signup failed")

      setUser(user)
      setProfile(user)
    } catch (err) {
      console.error("Signup error:", err)
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
      const res = await fetch(`/api/users/${user.userId}`, {
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
    // checkDatabaseSetup,
  }

  if (!isHydrated || loading) {
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
