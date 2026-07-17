import { NextResponse } from 'next/server'
import { loadCastAndCrew } from '@/lib/cast-crew-loader'
import { reportServerError } from '@/lib/server-error'

export async function GET() {
  try {
    const castAndCrew = loadCastAndCrew()
    return NextResponse.json(castAndCrew)
  } catch (error) {
    reportServerError('Failed to load cast and crew:', error)
    return NextResponse.json(
      { error: 'Failed to load cast and crew' },
      { status: 500 }
    )
  }
}