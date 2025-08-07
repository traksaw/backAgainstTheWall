// components/ui/fade-in.tsx
"use client"

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  distance?: number
  threshold?: number
  triggerOnce?: boolean
  cascade?: boolean
  cascadeDelay?: number
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 800,
  direction = 'up',
  distance = 30,
  threshold = 0.1,
  triggerOnce = true,
  cascade = false,
  cascadeDelay = 150,
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!triggerOnce || !hasTriggered)) {
          setIsVisible(true)
          if (triggerOnce) {
            setHasTriggered(true)
          }
        } else if (!triggerOnce && !entry.isIntersecting) {
          setIsVisible(false)
        }
      },
      { threshold }
    )

    const currentElement = elementRef.current
    if (currentElement) {
      observer.observe(currentElement)
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement)
      }
    }
  }, [threshold, triggerOnce, hasTriggered])

  const getTransform = () => {
    if (direction === 'none') return 'translate3d(0, 0, 0)'
    
    const transforms = {
      up: `translate3d(0, ${distance}px, 0)`,
      down: `translate3d(0, -${distance}px, 0)`,
      left: `translate3d(${distance}px, 0, 0)`,
      right: `translate3d(-${distance}px, 0, 0)`,
    }
    return transforms[direction]
  }

  const baseStyles: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translate3d(0, 0, 0)' : getTransform(),
    transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
    willChange: 'opacity, transform',
  }

  if (cascade && React.Children.count(children) > 1) {
    return (
      <div ref={elementRef} className={className}>
        {React.Children.map(children, (child, index) => (
          <div
            key={index}
            style={{
              ...baseStyles,
              transitionDelay: `${delay + index * cascadeDelay}ms`,
            }}
          >
            {child}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={elementRef}
      className={cn('transition-all', className)}
      style={baseStyles}
    >
      {children}
    </div>
  )
}

// Preset components for common use cases
export function FadeInUp({ children, ...props }: Omit<FadeInProps, 'direction'>) {
  return <FadeIn direction="up" {...props}>{children}</FadeIn>
}

export function FadeInDown({ children, ...props }: Omit<FadeInProps, 'direction'>) {
  return <FadeIn direction="down" {...props}>{children}</FadeIn>
}

export function FadeInLeft({ children, ...props }: Omit<FadeInProps, 'direction'>) {
  return <FadeIn direction="left" {...props}>{children}</FadeIn>
}

export function FadeInRight({ children, ...props }: Omit<FadeInProps, 'direction'>) {
  return <FadeIn direction="right" {...props}>{children}</FadeIn>
}

export function FadeInScale({ 
  children, 
  className,
  delay = 0,
  duration = 800,
  threshold = 0.1,
  triggerOnce = true,
}: Omit<FadeInProps, 'direction' | 'distance'>) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!triggerOnce || !hasTriggered)) {
          setIsVisible(true)
          if (triggerOnce) {
            setHasTriggered(true)
          }
        } else if (!triggerOnce && !entry.isIntersecting) {
          setIsVisible(false)
        }
      },
      { threshold }
    )

    const currentElement = elementRef.current
    if (currentElement) {
      observer.observe(currentElement)
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement)
      }
    }
  }, [threshold, triggerOnce, hasTriggered])

  const baseStyles: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1)' : 'scale(0.8)',
    transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
    willChange: 'opacity, transform',
  }

  return (
    <div
      ref={elementRef}
      className={cn('transition-all', className)}
      style={baseStyles}
    >
      {children}
    </div>
  )
}