import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  // Set turbopack root to silence warning about multiple lockfiles
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
