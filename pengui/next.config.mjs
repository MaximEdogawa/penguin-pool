/** @type {import('next').NextConfig} */

import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { join } from 'path'

const require = createRequire(import.meta.url)

const CopyPlugin = require('copy-webpack-plugin')

// Load .env.local file manually to access WALLET_CONNECT_PROJECT_ID
const loadEnvLocal = () => {
  try {
    const envPath = join(process.cwd(), '.env.local')
    const envFile = readFileSync(envPath, 'utf8')
    const envVars = {}
    envFile.split('\n').forEach((line) => {
      const match = line.match(/^([^=:#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        envVars[key] = value
      }
    })
    return envVars
  } catch {
    return {}
  }
}

const envLocal = loadEnvLocal()

const nextConfig = {
  transpilePackages: ['@chia/wallet-connect'],
  env: {
    // Expose WALLET_CONNECT_PROJECT_ID as NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID for client-side access
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID:
      process.env.WALLET_CONNECT_PROJECT_ID || envLocal.WALLET_CONNECT_PROJECT_ID || '',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Replace 'fs' with an empty module on the client-side
      config.resolve.fallback = { fs: false }

      config.plugins.push(
        new CopyPlugin({
          patterns: [{ from: 'public/blsjs.wasm', to: 'static/chunks' }],
        })
      )
    }

    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  async rewrites() {
    return [
      {
        source: '/:path*/blsjs.wasm',
        destination: '/blsjs.wasm',
      },
    ]
  },
}

export default nextConfig
