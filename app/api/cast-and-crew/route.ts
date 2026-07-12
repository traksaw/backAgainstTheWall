// Create a new file: /app/api/cast-and-crew/route.ts

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { loadCastAndCrew } from '@/lib/cast-crew-loader'

export async function GET() {
  try {
    const castAndCrew = loadCastAndCrew()
    return NextResponse.json(castAndCrew)
  } catch (error) {
    console.error('Error loading cast and crew:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to load cast and crew' },
      { status: 500 }
    )
  }
}