// hooks/useFilmModal.ts
import { useState, useCallback } from 'react'
import type { QuizResult } from '@/types/quiz'

interface UseFilmModalProps {
  latestResult?: QuizResult | null
  user?: any
  onFilmComplete?: (result: QuizResult) => void
}

export function useFilmModal({ latestResult, user, onFilmComplete }: UseFilmModalProps = {}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handle video start
   */
  const handleVideoStart = useCallback(() => {
    setHasStarted(true)
    setIsPlaying(true)
    setError(null)
  }, [])

  /**
   * Handle video play/pause
   */
  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  /**
   * Handle video time update
   */
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  /**
   * Handle video duration loaded
   */
  const handleDurationChange = useCallback((dur: number) => {
    setDuration(dur)
  }, [])

  /**
   * Handle video end
   */
  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false)
    setHasEnded(true)
    
    // Call completion handler if provided
    if (onFilmComplete && latestResult) {
      onFilmComplete(latestResult)
    }
  }, [onFilmComplete, latestResult])

  /**
   * Handle video error
   */
  const handleVideoError = useCallback((errorMessage: string) => {
    console.error("Video playback error:", errorMessage)
    setError(errorMessage)
    setIsPlaying(false)
  }, [])

  /**
   * Reset video state
   */
  const resetVideoState = useCallback(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setHasStarted(false)
    setHasEnded(false)
    setError(null)
  }, [])

  /**
   * Seek to specific time
   */
  const seekTo = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)))
  }, [duration])

  /**
   * Get viewing context text based on user state
   */
  const getViewingContext = useCallback(() => {
    if (user && latestResult?.archetype) {
      return {
        title: `Watching as The ${latestResult.archetype}`,
        description: `Notice how the characters' financial decisions reflect your own mindset`
      }
    }
    
    return {
      title: "Watching as A Guest", 
      description: "Observe how different financial personalities handle pressure"
    }
  }, [user, latestResult])

  /**
   * Calculate progress percentage
   */
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  /**
   * Format time for display
   */
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [])

  return {
    // Video state
    isPlaying,
    currentTime,
    duration,
    hasStarted,
    hasEnded,
    error,
    progressPercentage,

    // Event handlers
    handleVideoStart,
    handlePlayPause,
    handleTimeUpdate,
    handleDurationChange,
    handleVideoEnd,
    handleVideoError,
    resetVideoState,
    seekTo,

    // Computed values
    getViewingContext,
    formatTime,
    
    // Helper functions
    canPlay: !error && duration > 0,
    isComplete: hasEnded,
    formattedCurrentTime: formatTime(currentTime),
    formattedDuration: formatTime(duration),
  }
}