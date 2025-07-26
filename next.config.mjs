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
  }, env: {
    MONGODB_URI: process.env.MONGODB_URI,
  },
}


export default nextConfig
