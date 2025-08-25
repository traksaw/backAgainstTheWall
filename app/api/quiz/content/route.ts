import { NextResponse } from 'next/server'
import { fetchQuizContent } from '@/lib/quiz/content'

export const revalidate = 60 // cache for 1 minute; adjust as needed

export async function GET() {
  try {
    const data = await fetchQuizContent()
    return NextResponse.json({ success: true, ...data })
  } catch (e) {
    console.error('Error in /api/quiz/content:', e)
    return NextResponse.json({ success: false, error: 'Failed to load quiz content' }, { status: 500 })
  }
}
