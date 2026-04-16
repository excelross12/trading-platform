import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ✦ Required for Socket.io custom server pattern
  experimental: {
    serverComponentsExternalPackages: ['socket.io'],
  },
}

export default nextConfig
