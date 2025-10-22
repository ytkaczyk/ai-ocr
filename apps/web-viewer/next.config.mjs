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
}

export default nextConfig
