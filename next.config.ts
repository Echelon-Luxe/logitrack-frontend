import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Emits a self-contained server with only the files actually imported.
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
