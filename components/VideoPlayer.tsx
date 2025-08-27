"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Loader2 } from "lucide-react"

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
  onEnded?: () => void
  onError?: (error: string) => void
  className?: string
  autoPlay?: boolean
  archetype?: string
  webmSrc?: string
}

export function VideoPlayer({
  src,
  poster,
  title,
  onEnded,
  onError,
  className = "",
  autoPlay = false,
  archetype,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      console.log('Video metadata loaded:', {
        duration: videoRef.current.duration,
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight,
        readyState: videoRef.current.readyState,
        networkState: videoRef.current.networkState
      })
      setIsLoading(false)
    }
  }

  const handlePlay = () => setIsPlaying(true)
  const handlePause = () => setIsPlaying(false)
  const handleEnded = () => onEnded?.()

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget
    const error = video.error
    console.error('Video Error:', {
      errorCode: error?.code,
      errorMessage: error?.message,
      readyState: video.readyState,
      networkState: video.networkState,
      currentSrc: video.currentSrc,
      src: video.src
    })
    setHasError(true)
    onError?.(error?.message || 'Failed to load video')
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20">
          <div className="text-center space-y-4 text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto" />
            <p className="text-lg">Loading video...</p>
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        title={title}
        playsInline
        controls
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        onLoadedMetadata={handleLoadedMetadata}
        autoPlay={autoPlay}
        preload="metadata"
        src={src}
      >
        Your browser does not support the video tag.
        <track kind="captions" />
      </video>

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && !hasError && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={() => videoRef.current?.play().catch(console.error)}
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 hover:bg-white/30 transition-all duration-300">
            <Play className="w-12 h-12 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
          <div className="text-center text-white">
            <p className="text-lg mb-4">Unable to load video</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white"
            >
              Reload Page
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
