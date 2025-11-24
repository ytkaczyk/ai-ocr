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
  
  // Configure headers for caching (T102b) and security (T115)
  async headers() {
    return [
      {
        // Apply security headers to all routes (T115 - CSP for FR-033)
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval for PDF.js worker, unsafe-inline for Next.js
              "style-src 'self' 'unsafe-inline'", // unsafe-inline for Tailwind
              "img-src 'self' data: blob:", // data: for PDF.js canvas, blob: for dynamic images
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'", // Prevent clickjacking
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevent clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevent MIME sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()', // Disable unnecessary features
          },
        ],
      },
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
