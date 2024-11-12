/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    // During development you may want to set this to true to see the app even with type errors
    ignoreBuildErrors: false
  }
}

module.exports = nextConfig
