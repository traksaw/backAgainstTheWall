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

function studioAuthCheck(req: NextRequest): NextResponse | null {
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

  return null
}

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/sanity-studio')) {
    const denied = studioAuthCheck(req)
    if (denied) return denied
    // Studio's own CSP (next.config.mjs, already 'unsafe-inline'/'unsafe-eval')
    // already tolerates Next's inline bootstrap scripts - no nonce needed here.
    return NextResponse.next()
  }

  // WAS-33: script-src 'self' alone blocks Next.js App Router's own inline
  // hydration <script> tags (confirmed live: blank page on every route,
  // self.__next_f never populated). A per-request nonce plus 'strict-dynamic'
  // (Next's own documented CSP pattern) keeps script-src genuinely strict -
  // an attacker's injected inline script still lacks the correct nonce and
  // is blocked - while letting Next's own scripts (and the chunks they
  // dynamically load) run. app/layout.tsx reads this same nonce via
  // headers() to opt the render into using it for Next's own inline scripts.
  //
  // `next dev`'s webpack HMR/React Refresh runtime calls eval() to apply
  // updates - confirmed live: with no carve-out, every route hydrated to a
  // blank page (`EvalError: ... violates ... 'unsafe-eval' is not an
  // allowed source`). 'unsafe-eval' only loosens script-src, and only when
  // NODE_ENV isn't 'production' (next build/start), so the deployed CSP is
  // unchanged from the strict policy above.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isProdBuild = process.env.NODE_ENV === 'production'
  const scriptSrc = isProdBuild
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
  const csp = `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: cdn.sanity.io *.public.blob.vercel-storage.com; media-src 'self' *.public.blob.vercel-storage.com; font-src 'self'; connect-src 'self' https://formspree.io https://o4511723969904640.ingest.us.sentry.io; object-src 'none'; base-uri 'self'; frame-ancestors 'none';`

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
