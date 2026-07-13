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
