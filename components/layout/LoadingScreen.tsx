// components/layout/LoadingScreen.tsx
"use client"

interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B95D38] mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}