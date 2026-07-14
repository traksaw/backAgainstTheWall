"use client"

import type React from "react"

import { useSyncExternalStore } from "react"

interface ClientOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

function subscribe() {
  return () => {}
}

function getSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const hasMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
