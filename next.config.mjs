import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },
  // This ensures that public files are properly served in production
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,
  // This ensures that public files are properly served in production
  async headers() {
    return [
      {
        source: '/videos/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // WAS-33: baseline security headers for every route. CSP here is
        // the strict policy - /sanity-studio below fully overrides just
        // the Content-Security-Policy value for its own routes, since
        // Next.js applies the last-matching source's value per header key.
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: cdn.sanity.io *.public.blob.vercel-storage.com; media-src 'self' *.public.blob.vercel-storage.com; font-src 'self'; connect-src 'self' https://formspree.io https://o4511723969904640.ingest.us.sentry.io; object-src 'none'; base-uri 'self'; frame-ancestors 'none';",
          },
        ],
      },
      {
        // WAS-33: Sanity Studio is a bundled SPA that needs 'unsafe-inline'
        // and 'unsafe-eval' in script-src, plus its own API/realtime
        // domains in connect-src - scoped to this route only so the rest
        // of the app keeps the strict policy above. Already gated by
        // Basic Auth in middleware.ts (WAS-17).
        source: '/sanity-studio/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: cdn.sanity.io *.public.blob.vercel-storage.com; font-src 'self' data:; connect-src 'self' https://*.api.sanity.io wss://*.api.sanity.io https://cdn.sanity.io https://apicdn.sanity.io; object-src 'none'; base-uri 'self'; frame-ancestors 'none';",
          },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  // WAS-16: errors-only otherwise (no tracing/replay), but source maps are
  // enabled so stack traces in Sentry show real TypeScript, not minified
  // bundle code. Upload only runs when SENTRY_AUTH_TOKEN is set (e.g. in CI/
  // Vercel prod builds) - local dev builds skip it silently without one.
  org: 'philacon-valley',
  project: 'back-against-the-wall',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  telemetry: false,
})
