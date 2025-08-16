/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  },
  experimental: {
    esmExternals: 'loose',
    optimizePackageImports: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  outputFileTracing: false,
}

export default nextConfig
