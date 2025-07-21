"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { AuthService } from "@/lib/auth"
import type { UserProfile } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (data: any) => Promise<void>
  signIn: (data: any) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Ensure we're mounted before doing anything client-side
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await loadUserProfile(session.user)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [mounted])

  const createFallbackProfile = (user: User | null, signupData?: any): UserProfile => {
    // Handle case where user might be null
    const userId = user?.id || "temp-" + Math.random().toString(36).substr(2, 9)
    const userEmail = user?.email || signupData?.email || "user@example.com"

    return {
      id: userId,
      first_name: signupData?.firstName || user?.user_metadata?.first_name || userEmail.split("@")[0] || "User",
      last_name: signupData?.lastName || user?.user_metadata?.last_name || "",
      zip_code: signupData?.zipcode || user?.user_metadata?.zipcode || "00000",
      professional_status:
        signupData?.occupationStatus || (user?.user_metadata?.occupation_status as any) || "working-professional",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  const loadUserProfile = async (userObj: User, signupData?: any) => {
    try {
      console.log("Loading user profile for user:", userObj.id)

      // Try to get profile from database
      const userProfile = await AuthService.getUserProfile(userObj.id)

      if (userProfile) {
        console.log("Successfully loaded user profile from database")
        setProfile(userProfile)
      } else {
        // Database not ready or profile doesn't exist - create fallback
        console.log("Database not ready - creating fallback profile")
        const fallbackProfile = createFallbackProfile(userObj, signupData)
        setProfile(fallbackProfile)
        console.log("Created fallback profile:", fallbackProfile)
      }
    } catch (error) {
      console.error("Unexpected error loading user profile:", error)

      // Even if there's an error, create a fallback profile
      const fallbackProfile = createFallbackProfile(userObj, signupData)
      setProfile(fallbackProfile)
      console.log("Created fallback profile due to error:", fallbackProfile)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (data: any) => {
    setLoading(true)
    try {
      const result = await AuthService.signUp(data)

      // If signup successful but user not immediately available, create fallback profile
      if (result.user) {
        await loadUserProfile(result.user, data)
      } else {
        // Create temporary profile with signup data
        const tempProfile = createFallbackProfile(null, data)
        setProfile(tempProfile)
        setLoading(false)
      }
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signIn = async (data: any) => {
    setLoading(true)
    try {
      await AuthService.signIn(data)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await AuthService.signOut()
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in")

    try {
      const updatedProfile = await AuthService.updateUserProfile(user.id, updates)
      setProfile(updatedProfile)
    } catch (error) {
      throw error
    }
  }

  const refreshProfile = async () => {
    if (!user) return
    await loadUserProfile(user)
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
  }

  // Always render the provider so descendants can call useAuth safely
  if (!mounted) {
    const fallbackValue: AuthContextType = {
      user: null,
      profile: null,
      session: null,
      loading: true,
      signUp: async () => {},
      signIn: async () => {},
      signOut: async () => {},
      updateProfile: async () => {},
      refreshProfile: async () => {},
    }
    return <AuthContext.Provider value={fallbackValue}>{children}</AuthContext.Provider>
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
