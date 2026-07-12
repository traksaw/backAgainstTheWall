import { createHash, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

// WAS-17: /sanity-studio was reachable by anyone who found the URL, protected
// only by Sanity's own login on a route with no app-level gate. This app has
// no admin/role concept of its own (single-operator content editor), so a
// full session-auth integration would be overkill for what's really needed
// here - a basic access gate before the route is even served.
function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Sanity Studio"' },
  })
}

// Hashing to a fixed length before comparing means timingSafeEqual never sees
// mismatched buffer lengths, so a plain !== check on user-supplied credentials
// can't leak how much of the secret was guessed correctly via response timing.
function safeEqual(a: string, b: string) {
  const aHash = createHash('sha256').update(a).digest()
  const bHash = createHash('sha256').update(b).digest()
  return timingSafeEqual(aHash, bHash)
}

export function middleware(req: NextRequest) {
  const username = process.env.SANITY_STUDIO_USERNAME
  const password = process.env.SANITY_STUDIO_PASSWORD

  if (!username || !password) {
    // Fail closed: an unconfigured gate must not mean "no gate."
    return new NextResponse('Sanity Studio access is not configured', { status: 500 })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Basic ')) {
    return unauthorized()
  }

  const decoded = Buffer.from(authHeader.slice('Basic '.length), 'base64').toString('utf-8')
  const separatorIndex = decoded.indexOf(':')
  const user = separatorIndex === -1 ? decoded : decoded.slice(0, separatorIndex)
  const pass = separatorIndex === -1 ? '' : decoded.slice(separatorIndex + 1)

  if (!safeEqual(user, username) || !safeEqual(pass, password)) {
    return unauthorized()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/sanity-studio', '/sanity-studio/:path*'],
}
