/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✦ Socket.io server runs externally — exclude from server bundle (Next.js 14 key)
  experimental: {
    serverComponentsExternalPackages: ['socket.io'],
  },
}

export default nextConfig
