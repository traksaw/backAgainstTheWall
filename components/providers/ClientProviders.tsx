"use client"

import type React from "react"
import { AuthProvider } from "@/hooks/useAuth"

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
