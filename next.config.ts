import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "frame-src https://www.youtube.com https://open.spotify.com",
      "connect-src 'self' https:",
      "font-src 'self'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Scope docs file tracing to only docs/ and root .md files.
  // Both the API route and the server-rendered page use dynamic fs operations
  // (readdirSync, readFileSync) which causes Turbopack NFT to trace the entire
  // project. This limits the trace to the directories they actually read from.
  outputFileTracingIncludes: {
    "/api/docs": ["./docs/**/*", "./README.md", "./CHANGELOG.md"],
    "/docs": ["./docs/**/*", "./README.md", "./CHANGELOG.md"],
  },
  outputFileTracingExcludes: {
    "/api/docs": [
      "./node_modules/**/*",
      "./src/**/*",
      "./.next/**/*",
      "./.git/**/*",
      "./tests/**/*",
    ],
    "/docs": [
      "./node_modules/**/*",
      "./src/**/*",
      "./.next/**/*",
      "./.git/**/*",
      "./tests/**/*",
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      // Meta CDN wildcards — Instagram uses many subdomains (scontent-*.cdninstagram.com)
      {
        protocol: "https",
        hostname: "*.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "*.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "cdn.bsky.app",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
