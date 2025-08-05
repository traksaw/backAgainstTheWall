// Create a new file: /app/api/cast-and-crew/route.ts

import { NextResponse } from 'next/server'
import { loadCastAndCrew } from '@/lib/cast-crew-loader'

export async function GET() {
  try {
    const castAndCrew = loadCastAndCrew()
    return NextResponse.json(castAndCrew)
  } catch (error) {
    console.error('Error loading cast and crew:', error)
    return NextResponse.json(
      { error: 'Failed to load cast and crew' },
      { status: 500 }
    )
  }
}