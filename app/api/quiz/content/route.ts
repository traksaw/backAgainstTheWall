import { NextResponse } from 'next/server'
import { fetchQuizContent } from '@/lib/quiz/content'

// Force dynamic rendering and disable caching so Sanity updates appear immediately
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const data = await fetchQuizContent()
    return NextResponse.json({ success: true, ...data })
  } catch (e) {
    console.error('Error in /api/quiz/content:', e)
    return NextResponse.json({ success: false, error: 'Failed to load quiz content' }, { status: 500 })
  }
}
