/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Temporarily ignore TypeScript errors during build
    ignoreBuildErrors: true
  }
}

module.exports = nextConfig
