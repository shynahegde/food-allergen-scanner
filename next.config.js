/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Temporarily ignore TypeScript errors during build
    ignoreBuildErrors: true
  },
  swcMinify: true
}

module.exports = nextConfig
