/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow images from our API routes
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
    // Since markdown images come from our API, we use unoptimized mode
    // This prevents external optimization requests and uses images as-is
    unoptimized: false,
  },
  // Empty turbopack config for Next.js 16 (Turbopack is default)
  turbopack: {},
  
  // Performance optimizations (T102)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Configure headers for caching (T102b)
  async headers() {
    return [
      {
        // Cache document metadata for 1 hour
        source: '/api/documents',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Cache document details for 1 hour
        source: '/api/documents/:documentId',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Cache page content with stale-while-revalidate
        source: '/api/documents/:documentId/pages/:pageNumber/:type',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        // Cache images for 7 days
        source: '/api/documents/:documentId/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, immutable',
          },
        ],
      },
    ];
  },
}

export default nextConfig
