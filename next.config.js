/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    dirs: ['app', 'components', 'lib']
  },
  typescript: {
    ignoreBuildErrors: false
  }
}

module.exports = nextConfig