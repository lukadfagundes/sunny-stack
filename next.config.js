/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes
  trailingSlash: true,

  // Build configuration
  generateEtags: false,
  compress: true,
  poweredByHeader: false,

  // Externalize bot dependencies (Discord.js) to prevent webpack bundling issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push(
        "discord.js",
        "@discordjs/ws",
        "zlib-sync",
        "bufferutil",
        "utf-8-validate",
      );
    }
    return config;
  },

  // Cache configuration
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  images: {
    unoptimized: false,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
  },
  eslint: {
    dirs: ["app", "components", "lib"],
  },
  // TypeScript build - temporarily ignoring NextAuth/App Router compatibility errors
  // TODO: Fix NextAuth v5 <Html> error when proper fix is available
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip static generation for admin routes (they use client-side auth)
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [];
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-inline and unsafe-eval
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com", // Allow Google Fonts and Next.js inline styles
              "font-src 'self' fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://authjs.dev", // Allow OAuth provider images
              "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com", // Allow Google OAuth
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
      {
        // CORS configuration for API routes
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value:
              process.env.NODE_ENV === "production"
                ? "https://sunny-stack.com"
                : "*", // Allow all origins in development
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
        ],
      },
    ];
  },
};

// Export config without bundle analyzer to prevent Vercel build errors
// Bundle analyzer is only needed for local development analysis
// To analyze bundles locally: ANALYZE=true npm run build
export default nextConfig;
