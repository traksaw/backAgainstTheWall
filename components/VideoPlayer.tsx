"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Maximize, Minimize, RotateCcw, AlertCircle, Loader2 } from "lucide-react"

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
  onEnded?: () => void
  onError?: (error: string) => void
  className?: string
  autoPlay?: boolean
  archetype?: string
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
  const containerRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isBuffering, setIsBuffering] = useState(false)

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout

    const resetTimeout = () => {
      clearTimeout(timeout)
      setShowControls(true)
      if (isPlaying) {
        timeout = setTimeout(() => setShowControls(false), 3000)
      }
    }

    const handleMouseMove = () => resetTimeout()
    const handleMouseLeave = () => {
      if (isPlaying) {
        timeout = setTimeout(() => setShowControls(false), 1000)
      }
    }

    if (containerRef.current) {
      containerRef.current.addEventListener("mousemove", handleMouseMove)
      containerRef.current.addEventListener("mouseleave", handleMouseLeave)
    }

    resetTimeout()

    return () => {
      clearTimeout(timeout)
      if (containerRef.current) {
        containerRef.current.removeEventListener("mousemove", handleMouseMove)
        containerRef.current.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [isPlaying])

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsLoading(false)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handlePlay = () => setIsPlaying(true)
  const handlePause = () => setIsPlaying(false)

  const handleEnded = () => {
    setIsPlaying(false)
    onEnded?.()
  }

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget
    const error = video.error
    let message = "An error occurred while loading the video"

    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          message = "Video playback was aborted"
          break
        case MediaError.MEDIA_ERR_NETWORK:
          message = "Network error occurred while loading video"
          break
        case MediaError.MEDIA_ERR_DECODE:
          message = "Video format not supported or corrupted"
          break
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          message = "Video format not supported by your browser"
          break
      }
    }

    setHasError(true)
    setErrorMessage(message)
    setIsLoading(false)
    onError?.(message)
  }

  const handleWaiting = () => setIsBuffering(true)
  const handleCanPlay = () => setIsBuffering(false)

  // Control functions
  const togglePlay = async () => {
    if (!videoRef.current) return

    try {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        await videoRef.current.play()
      }
    } catch (error) {
      console.error("Playback error:", error)
      setHasError(true)
      setErrorMessage("Unable to play video. Please try again.")
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * duration
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted
      videoRef.current.muted = newMuted
      setIsMuted(newMuted)
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
    } catch (error) {
      console.error("Fullscreen error:", error)
    }
  }

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      setCurrentTime(0)
    }
  }

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
    }
  }

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Format time helper
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return

      switch (e.code) {
        case "Space":
          e.preventDefault()
          togglePlay()
          break
        case "ArrowLeft":
          e.preventDefault()
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, currentTime - 10)
          }
          break
        case "ArrowRight":
          e.preventDefault()
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, currentTime + 10)
          }
          break
        case "ArrowUp":
          e.preventDefault()
          handleVolumeChange([Math.min(100, volume * 100 + 10)])
          break
        case "ArrowDown":
          e.preventDefault()
          handleVolumeChange([Math.max(0, volume * 100 - 10)])
          break
        case "KeyM":
          e.preventDefault()
          toggleMute()
          break
        case "KeyF":
          e.preventDefault()
          toggleFullscreen()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [currentTime, duration, volume, isPlaying])

  if (hasError) {
    return (
      <div className={`relative bg-gray-900 rounded-lg flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center space-y-4 text-white p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <div>
            <h3 className="text-xl font-semibold mb-2">Video Playback Error</h3>
            <p className="text-gray-300 mb-4">{errorMessage}</p>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setHasError(false)
                  setIsLoading(true)
                  if (videoRef.current) {
                    videoRef.current.load()
                  }
                }}
                className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <p className="text-xs text-gray-400">Try refreshing the page or check your internet connection</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative bg-black rounded-lg overflow-hidden group ${className}`} tabIndex={0}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20">
          <div className="text-center space-y-4 text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto" />
            <p className="text-lg">Loading video...</p>
            {title && <p className="text-sm text-gray-400">{title}</p>}
          </div>
        </div>
      )}

      {/* Buffering Overlay */}
      {isBuffering && !isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}

      {/* Archetype Badge */}
      {archetype && (
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-[#B95D38]/90 text-white px-3 py-1 rounded-full text-sm font-medium">The {archetype}</div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
      >
        {/* Fallback for browsers that don't support MP4 */}
        <p className="text-white text-center p-8">
          Your browser doesn't support video playback.
          <a href={src} className="text-orange-500 underline ml-1">
            Download the video instead
          </a>
        </p>
      </video>

      {/* Click to Play Overlay */}
      {!isPlaying && !isLoading && (
        <div
          className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer z-10"
          onClick={togglePlay}
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-6 hover:bg-white/30 transition-all duration-300">
            <Play className="w-12 h-12 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Simplified Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Simple Progress Bar */}
        <div className="mb-3">
          <Slider
            value={[duration ? (currentTime / duration) * 100 : 0]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Minimal Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={togglePlay} className="text-white hover:bg-white/20 p-2">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>

            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-white/20 p-2">
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      {/* <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-black/70 text-white text-xs p-2 rounded">
          <div className="space-y-1">
            <div>Space: Play/Pause</div>
            <div>←/→: Seek ±10s</div>
            <div>↑/↓: Volume</div>
            <div>M: Mute</div>
            <div>F: Fullscreen</div>
          </div>
        </div>
      </div> */}
    </div>
  )
}
