'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Supporter } from '@/types/supporter'
import { LoadingScreen } from '@/components/layout/LoadingScreen'

interface FilmWebsiteClientProps {
  initialSupporters: Supporter[]
}

export function FilmWebsiteClient({ initialSupporters }: FilmWebsiteClientProps) {
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const [supporters] = useState<Supporter[]>(initialSupporters)
  const [isHydrated, setIsHydrated] = useState(false)

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Show loading screen while auth is loading or not hydrated
  if (authLoading || !isHydrated) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Back Against The Wall</h1>
        
        {user ? (
          <div className="text-center">
            <p className="mb-4">Welcome back, {user.email}!</p>
            <button 
              onClick={signOut}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4">Welcome to our film website</p>
          </div>
        )}

        {supporters.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Our Supporters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {supporters.slice(0, 6).map((supporter, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded">
                  <p className="font-semibold">{supporter.name}</p>
                  {supporter.description && (
                    <p className="text-sm text-gray-300 mt-2">{supporter.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
