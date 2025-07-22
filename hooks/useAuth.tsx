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
  isHydrated: boolean
  databaseStatus: "checking" | "ready" | "error" | "setup-required"
  signUp: (data: any) => Promise<void>
  signIn: (data: any) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
  checkDatabaseSetup: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [databaseStatus, setDatabaseStatus] = useState<"checking" | "ready" | "error" | "setup-required">("checking")

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    const checkSetup = async () => {
      try {
        const setupStatus = await AuthService.checkDatabaseSetup()
        setDatabaseStatus(setupStatus.isSetup ? "ready" : "setup-required")
      } catch (error) {
        console.error("Database setup check failed:", error)
        setDatabaseStatus("error")
      }
    }

    checkSetup()
  }, [isHydrated])

  useEffect(() => {
    if (!isHydrated) return

    let isMounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        if (!isMounted) return

        setSession(initialSession)
        setUser(initialSession?.user ?? null)

        if (initialSession?.user) {
          await loadUserProfile(initialSession.user)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
        if (isMounted) setLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      console.log("Auth state change:", event, !!session?.user)
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await loadUserProfile(session.user)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [isHydrated, databaseStatus])

  const loadUserProfile = async (userObj: User) => {
    try {
      if (databaseStatus !== "ready") return

      const userProfile = await AuthService.getUserProfile(userObj.id)

      if (userProfile) {
        const completeProfile: UserProfile = {
          id: userProfile.id,
          email: userProfile.email ?? "",
          first_name: userProfile.first_name ?? "",
          last_name: userProfile.last_name ?? "",
          zip_code: userProfile.zipcode ?? "00000",
          occupation_status: userProfile.occupation_status ?? "working-professional",
          created_at: userProfile.created_at ?? new Date().toISOString(),
          updated_at: userProfile.updated_at ?? new Date().toISOString(),
        }

        setProfile(completeProfile)
      }

    } catch (error) {
      console.error("Error loading profile from Supabase:", error)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (data: any) => {
    setLoading(true)
    try {
      console.log("Starting signup process with data:", data)

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (error) throw error
      if (!authData.user) throw new Error("User not created")

      await supabase.from("user_profiles").insert([
        {
          id: authData.user.id,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          zipcode: data.zipcode,
          occupation_status: data.occupationStatus,
        },
      ])

      await loadUserProfile(authData.user)
    } catch (error) {
      console.error("Signup failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (data: any) => {
    setLoading(true)
    try {
      await AuthService.signIn(data.email, data.password)
    } catch (error) {
      console.error("Sign-in failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await AuthService.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
    } catch (error) {
      console.error("Sign-out failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in")

    try {
      if (databaseStatus === "ready") {
        const updatedProfile = await AuthService.updateUserProfile(user.id, updates)
        setProfile(updatedProfile)
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
      throw error
    }
  }

  const refreshProfile = async () => {
    if (!user) return
    await loadUserProfile(user)
  }

  const checkDatabaseSetup = async () => {
    setDatabaseStatus("checking")
    try {
      const setupStatus = await AuthService.checkDatabaseSetup()
      setDatabaseStatus(setupStatus.isSetup ? "ready" : "setup-required")
    } catch (error) {
      console.error("Database setup check failed:", error)
      setDatabaseStatus("error")
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isHydrated,
    databaseStatus,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    checkDatabaseSetup,
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
