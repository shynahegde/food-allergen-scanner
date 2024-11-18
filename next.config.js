/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=1, stale-while-revalidate=59'
          }
        ],
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/.well-known/vercel/microfrontend-routing',
          destination: '/api/routing'
        }
      ]
    }
  }
}

module.exports = nextConfig
