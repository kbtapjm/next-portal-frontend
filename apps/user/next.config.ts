import type { NextConfig } from 'next';
// BACKEND_URL is server-only; browser requests stay on the Next.js origin.
const config: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${process.env.BACKEND_URL ?? 'http://localhost:8081'}/api/:path*` }];
  },
};
export default config;
