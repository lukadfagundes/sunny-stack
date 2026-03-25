/**
 * V3 Portfolio Project Data
 * Pure TypeScript — no React/JSX imports.
 * Migrated from V2 app/portfolio/projects-data.tsx with JSX stripped.
 */

import type { ProjectData, ProjectCategory } from "./types";

const projects: ProjectData[] = [
  // ─── Professional ─────────────────────────────────────────────
  {
    id: "trinity-sdk",
    title: "Trinity Method SDK",
    tagline:
      "Investigation-first development methodology and toolkit for Claude Code",
    description:
      "Deploys 18 specialized AI agents, 21 slash commands, and BAS 6-phase quality gates to any project in 90 seconds via npx. Open-source methodology with persistent knowledge base, investigation templates, work orders, and crisis management across sessions.",
    category: "professional",
    techStack: ["TypeScript", "Node.js", "CLI", "AI Agents", "npm"],
    features: [
      {
        label: "18 Specialized AI Agents",
        description:
          "5 teams: Planning (MON, ROR, TRA, EUS), Execution (KIL, BAS, DRA), Support (APO, BON, CAP, URO), Leadership (ALY, AJ MAESTRO), Deployment (TAN, ZEN, INO, EIN), and Audit (JUNO)",
      },
      {
        label: "Investigation-First Methodology",
        description:
          "Systematic investigation before implementation with evidence-based decisions and scale-based workflows (SMALL / MEDIUM / LARGE)",
      },
      {
        label: "BAS 6-Phase Quality Gates",
        description:
          "Lint, Structure, Build, Test, Coverage (≥80%), and Review enforced automatically after every task",
      },
      {
        label: "21 Slash Commands",
        description:
          "Session management, planning, execution, maintenance, investigation, infrastructure, and utility commands for Claude Code",
      },
      {
        label: "Multi-Framework Support",
        description:
          "Node.js (ESLint + Prettier + Husky), Python (Black + Flake8), Flutter (Dart Analyzer), and Rust (Clippy + Rustfmt) with automated linting setup",
      },
    ],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/lukadfagundes/trinity-method-sdk",
      },
      {
        label: "npm",
        url: "https://www.npmjs.com/package/trinity-method-sdk",
      },
    ],
    status: "active",
    footer: "Get started: npx trinity-method-sdk deploy",
  },
  {
    id: "cola-records",
    title: "Cola Records",
    tagline: "Electron desktop app for managing developer contributions to open-source",
    description:
      "Features issue discovery, contribution tracking, built-in Git operations, an embedded IDE via Docker-hosted code-server, multi-tab terminal, Spotify integration, and a dashboard with real-time GitHub activity. 108 React components, 15 main process services, and 163 IPC channels.",
    category: "professional",
    techStack: [
      "Electron",
      "React 19",
      "TypeScript",
      "Vite",
      "SQLite",
      "Zustand",
      "Tailwind CSS",
      "Docker",
    ],
    features: [
      {
        label: "Issue Discovery & Tracking",
        description:
          "Search GitHub for good first issues, fork repositories, and track contribution progress through completion",
      },
      {
        label: "Embedded IDE & Terminal",
        description:
          "Code-server (VS Code) running in Docker with multi-project tab support, plus multi-tab terminal with Git Bash, PowerShell, and Zsh",
      },
      {
        label: "Full Git Integration",
        description:
          "Built-in Git operations with 17 IPC channels for clone, branch, commit, push, pull, and remote management",
      },
      {
        label: "GitHub Ecosystem",
        description:
          "Actions workflow viewer, Releases management, Pull Request management, and profile dashboard with 6 widgets",
      },
      {
        label: "Developer Experience",
        description:
          "Spotify playback, Discord community client, in-app documentation viewer with Mermaid diagram support, and auto-updates",
      },
    ],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/lukadfagundes/cola-records",
      },
      {
        label: "Download",
        url: "https://github.com/lukadfagundes/cola-records/releases",
      },
    ],
    status: "active",
    footer:
      "Available as NSIS installer (Windows), DMG (macOS), and AppImage/deb/rpm (Linux) with auto-updates.",
  },
  {
    id: "rinoa-platform",
    title: "Rinoa",
    tagline: "Hybrid cloud-edge data platform for a proprietary client application",
    description:
      "Production-grade hybrid platform combining Vercel serverless frontend with Raspberry Pi 5 edge computing backend. Manages 13,000+ database records with sub-3ms query performance and 99.9% uptime. Built using Trinity Method v2.0 investigation-first development methodology.",
    category: "professional",
    techStack: [
      "Next.js 15",
      "React 19",
      "PostgreSQL 18",
      "Express.js",
      "Docker",
      "Playwright",
      "Raspberry Pi 5",
      "NextAuth v5",
    ],
    features: [
      {
        label: "Hybrid Architecture",
        description:
          "Vercel cloud frontend + Raspberry Pi 5 edge backend with PostgreSQL 18, achieving 99.9% uptime",
      },
      {
        label: "Exceptional Performance",
        description:
          "Sub-3ms API response times, <14ms complex database queries, validated for 30,000+ record capacity",
      },
      {
        label: "Production Infrastructure",
        description:
          "Docker containerization, automated daily backups, system health monitoring, Watchtower auto-updates",
      },
      {
        label: "Enterprise Features",
        description:
          "NextAuth v5 Google OAuth, full-text search (PostgreSQL GIN indexing), RESTful API, Cloudflare SSL",
      },
      {
        label: "Multi-Tenant Ready",
        description:
          "Scalable architecture supporting 19 concurrent data sources with real-time synchronization",
      },
    ],
    links: [],
    status: "proprietary",
    footer:
      "Proprietary application — technical architecture and performance metrics showcased with client approval.",
  },

  // ─── Personal ─────────────────────────────────────────────────
  {
    id: "hytale-server-manager",
    title: "Hytale Server Manager",
    tagline: "Desktop app for managing Hytale dedicated game servers",
    description:
      "Monitor server status, view connected players with their gear and stats, manage warps, toggle mods, and browse game assets — all from a single interface. Built with Electron's multi-process architecture and strict context isolation. 17 invoke + 13 event IPC channels, 7 Zustand stores, 18 React components, and 240+ tests across 17 suites.",
    category: "personal",
    techStack: [
      "Electron 40",
      "React 19",
      "TypeScript",
      "Vite 6",
      "Zustand",
      "Tailwind CSS",
      "Jest",
      "Chokidar",
    ],
    features: [
      {
        label: "Server Control",
        description:
          "Start and stop the Hytale server with a single toggle, real-time log streaming with ANSI color support",
      },
      {
        label: "Player & Warp Viewer",
        description:
          "Browse online players with inventory, equipped armor, tools, and stat bars. View and sort server warp points with coordinates",
      },
      {
        label: "Mod Manager",
        description:
          "Enable or disable server mods with a toggle switch, server-state aware to prevent changes while running",
      },
      {
        label: "Game Asset Rendering",
        description:
          "Extracts icons and portraits from Assets.zip at runtime, served via a custom asset:// protocol with text fallback",
      },
      {
        label: "Auto-Updater",
        description:
          "Checks GitHub Releases for updates, downloads in the background, and installs with a restart",
      },
    ],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/lukadfagundes/hytale-server-manager",
      },
      {
        label: "Download",
        url: "https://github.com/lukadfagundes/hytale-server-manager/releases",
      },
    ],
    status: "active",
    footer:
      "Available as NSIS installer + portable (Windows) and AppImage/deb (Linux) with auto-updates via GitHub Releases.",
  },
  {
    id: "bwaincell",
    title: "Bwaincell",
    tagline: "Unified productivity platform with Discord bot, REST API, and PWA",
    description:
      "A monorepo productivity platform providing task management, reminders, lists, notes, budgets, scheduling, AI-powered suggestions, and random generators through three integrated interfaces: Discord Bot (10 slash commands with 49+ subcommands), REST API (39 authenticated endpoints), and Progressive Web App (Next.js 14).",
    category: "personal",
    techStack: [
      "TypeScript",
      "Discord.js",
      "Express",
      "Next.js 14",
      "PostgreSQL",
      "Sequelize",
      "Docker",
      "Gemini AI",
    ],
    features: [
      {
        label: "Triple Interface",
        description:
          "Discord bot, REST API with JWT auth, and installable PWA — all sharing the same backend",
      },
      {
        label: "Full Productivity Suite",
        description:
          "Tasks, lists, notes, reminders, budgets, event scheduling, and AI-powered date ideas via Gemini",
      },
      {
        label: "Smart Reminders",
        description:
          "One-time, daily, weekly, monthly, and yearly recurring reminders with timezone support",
      },
      {
        label: "Monorepo Architecture",
        description:
          "npm workspaces (backend, frontend, shared) with shared TypeScript types and 282 tests across 13 suites",
      },
      {
        label: "Self-Hosted Production",
        description:
          "Raspberry Pi 4B (backend + PostgreSQL via Docker) and Vercel (PWA frontend) with GitHub Actions CI/CD",
      },
    ],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/lukadfagundes/bwaincell",
      },
    ],
    status: "active",
  },
  {
    id: "stilltide",
    title: "Stilltide",
    tagline: "AI platform transforming equipment photos into valuation reports",
    description:
      "Production AI platform that combines Gemini AI with Google Workspace integration for automated equipment analysis, market research, and comprehensive reporting — all delivered via email in minutes. Deployed on Vercel frontend + Fly.io Docker backend with JWT auth.",
    category: "personal",
    techStack: [
      "React 19",
      "Vite",
      "Express",
      "Gemini AI",
      "Google APIs",
      "Docker",
    ],
    features: [
      {
        label: "Two-Phase AI Analysis",
        description:
          "Gemini 2.5 Flash for verified extraction + web-grounded market research",
      },
      {
        label: "Full Google Integration",
        description: "Drive, Docs, Gmail APIs with OAuth 2.0",
      },
      {
        label: "Automated Workflow",
        description:
          "Background processing, professional report generation, email delivery",
      },
      {
        label: "Production Deployed",
        description:
          "Vercel frontend + Fly.io Docker backend with JWT auth",
      },
    ],
    links: [
      {
        label: "Live App",
        url: "https://stilltide.sunny-stack.com",
      },
    ],
    status: "active",
  },
  {
    id: "spotify-rainmeter",
    title: "Spotify Now Playing",
    tagline: "Lightweight Rainmeter skin for Windows displaying Spotify track info",
    description:
      "Beautiful Rainmeter skin that displays your currently playing Spotify track with full playback controls. Features automatic OAuth 2.0 token management, album artwork caching, and real-time updates with 1-second API polling. Includes SpotifySetup.exe GUI utility for easy OAuth configuration.",
    category: "personal",
    techStack: [
      "Rainmeter",
      "Lua",
      "Python",
      "Spotify Web API",
      "OAuth 2.0",
      "PyInstaller",
    ],
    features: [
      {
        label: "Real-Time Track Information",
        description:
          "Song title, artist, album, and playback progress with visual progress bar",
      },
      {
        label: "Automatic Token Management",
        description:
          "OAuth 2.0 tokens refresh automatically every ~55 minutes — set it and forget it",
      },
      {
        label: "Album Artwork Caching",
        description:
          "Automatically downloads and caches album art locally with intelligent cache management",
      },
      {
        label: "Full Playback Controls",
        description:
          "Play/pause, next track, previous track buttons with Spotify Premium support",
      },
      {
        label: "Low Resource Usage",
        description:
          "5-10 MB RAM, <1% CPU, with graceful error handling and network resilience",
      },
    ],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/lukadfagundes/spotify-skin-rainmeter",
      },
      {
        label: "DeviantArt",
        url: "https://www.deviantart.com/strawhatluka/art/SpotifyNowPlaying-1-0-0-1275377835",
      },
    ],
    status: "active",
    footer:
      "Windows desktop enhancement — MIT licensed with 1-second real-time polling. Fully customizable colors, fonts, and layout.",
  },

  // ─── Contributions ────────────────────────────────────────────
  {
    id: "reactive-resume",
    title: "Reactive Resume",
    tagline: "Job search, AI resume tailoring, and DOCX export contribution",
    description:
      "A feature contribution to Reactive Resume (30k+ GitHub stars) adding three interconnected capabilities: job search from within the app using a pluggable provider system, AI-powered resume tailoring that creates optimized copies for specific job listings, and DOCX export with clean ATS-friendly formatting.",
    category: "contribution",
    techStack: [
      "React",
      "TypeScript",
      "Zustand",
      "Zod",
      "docx",
      "tRPC/oRPC",
      "Vitest",
    ],
    features: [
      {
        label: "Job Search Provider System",
        description:
          "Abstract provider interface with JSearch integration, search filters (employment type, location, remote, experience level), and real-time RapidAPI quota tracking",
      },
      {
        label: "AI Resume Tailoring Pipeline",
        description:
          "Select a job listing, duplicate resume, AI rewrites summary, experience, and skills for ATS optimization, then apply structured patches",
      },
      {
        label: "Skill Sync",
        description:
          "AI infers additional skills from experience, presents them for selection, and saves chosen skills back to the original base resume",
      },
      {
        label: "DOCX Export",
        description:
          "Client-side Word document generation supporting all 15 resume sections with clean typography and ATS-friendly structure",
      },
      {
        label: "Quota Tracking",
        description:
          "Real-time API usage display from RapidAPI response headers, shown on both the Job Search page and Settings panel",
      },
    ],
    links: [
      {
        label: "View Fork",
        url: "https://github.com/lukadfagundes/reactive-resume",
      },
      {
        label: "Reactive Resume",
        url: "https://rxresu.me",
      },
    ],
    status: "active",
    footer:
      "Contributed to Reactive Resume — an open-source resume builder with 30k+ GitHub stars.",
  },
];

export function getAllProjects(): ProjectData[] {
  return projects;
}

export function getProjectsByCategory(
  category: ProjectCategory
): ProjectData[] {
  return projects.filter((p) => p.category === category);
}

export function getProjectById(id: string): ProjectData | undefined {
  return projects.find((p) => p.id === id);
}
