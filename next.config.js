/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Temporarily ignore TypeScript errors
    ignoreBuildErrors: true
  }
}

module.exports = nextConfig
