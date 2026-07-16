/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    // Only relevant for `npm run dev` outside Docker — inside docker-compose,
    // nginx routes /api and /ai directly to their containers instead.
    return [
      { source: '/api/:path*', destination: 'http://localhost:8080/:path*' },
      { source: '/ai/:path*', destination: 'http://localhost:8000/:path*' }
    ];
  }
};

module.exports = nextConfig;
