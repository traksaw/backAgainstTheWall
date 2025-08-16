import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify the webhook is from Sanity (optional but recommended)
    const secret = request.nextUrl.searchParams.get('secret')
    if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
    }

    // Get the document type from the webhook payload
    const { _type } = body

    // Revalidate based on document type
    if (_type === 'castMember') {
      revalidateTag('cast-and-crew')
    }

    // You can add more document types here as needed
    // if (_type === 'otherType') {
    //   revalidateTag('other-content')
    // }

    return NextResponse.json({ 
      message: 'Revalidated successfully',
      revalidated: true,
      now: Date.now()
    })
  } catch (error) {
    console.error('Error revalidating:', error)
    return NextResponse.json(
      { message: 'Error revalidating' }, 
      { status: 500 }
    )
  }
}
