/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TypeScript errors
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint errors
  }
}

module.exports = nextConfig
