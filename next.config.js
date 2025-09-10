/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
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