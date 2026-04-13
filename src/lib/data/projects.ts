/**
 * V3 Portfolio Project Data
 * Pure TypeScript - no React/JSX imports.
 * Migrated from V2 app/portfolio/projects-data.tsx with JSX stripped.
 */

import type { ProjectData, ProjectCategory } from "./types";

const projects: ProjectData[] = [
  // ─── Professional ─────────────────────────────────────────────
  {
    id: "cola-records",
    title: "Cola Records",
    tagline:
      "Cross-platform desktop developer workspace with 15 shipped releases",
    description:
      "Cross-platform desktop developer workspace. Embedded IDE (code-server in Docker), full Discord messaging client, Spotify player, multi-provider AI assistant (Gemini, Claude, GPT, Ollama), xterm.js terminal with node-pty, SQLite persistence, and auto-updates via GitHub Releases. 15 shipped releases across Windows, macOS, and Linux. 243 commits, 153 React components, 39 backend service files, 12 IPC handler domains, 11 Zustand stores.",
    category: "professional",
    techStack: [
      "Electron 40",
      "React 19",
      "TypeScript",
      "SQLite",
      "Vite 7",
      "Electron Forge",
      "Zustand",
      "Docker",
    ],
    features: [
      {
        label: "Embedded IDE & Terminal",
        description:
          "Code-server (VS Code) running in Docker with multi-project tab support, plus xterm.js terminal with node-pty for Git Bash, PowerShell, and Zsh",
      },
      {
        label: "Multi-Provider AI Assistant",
        description:
          "Integrated AI chat supporting Gemini, Claude, GPT, and Ollama with context-aware responses",
      },
      {
        label: "Discord Messaging Client",
        description:
          "Full Discord community client for messaging and collaboration without leaving the workspace",
      },
      {
        label: "Full Git & GitHub Ecosystem",
        description:
          "Built-in Git operations, Actions workflow viewer, Releases management, Pull Request management, and profile dashboard",
      },
      {
        label: "Spotify Player & Auto-Updates",
        description:
          "Integrated Spotify playback, in-app documentation viewer with Mermaid support, and auto-updates via GitHub Releases",
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
      "Available as NSIS installer (Windows), DMG (macOS), and AppImage/deb/rpm (Linux) with auto-updates. 15 shipped releases.",
  },
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
    id: "sunny-stack",
    title: "sunny-stack",
    tagline:
      "This portfolio site - Next.js 16 with 6 live API integrations and a playable 404 game",
    description:
      "This portfolio site. Next.js 16 + React 19 with 6 live API integrations (GitHub, Bluesky, Instagram, YouTube, Spotify, Steam), 10 REST endpoints, ISR caching, IP-based rate limiting, 434 tests at 90% coverage, a playable Zoro-themed 404 game, and a built-in documentation viewer with Mermaid diagram rendering.",
    category: "professional",
    techStack: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind CSS v4",
      "Vercel",
      "Framer Motion",
    ],
    features: [
      {
        label: "6 Live API Integrations",
        description:
          "GitHub GraphQL, Bluesky, Instagram Graph API, YouTube Data API, Spotify Web API, and Steam Web API with ISR caching",
      },
      {
        label: "434 Tests at 90% Coverage",
        description:
          "Comprehensive test suite covering components, API routes, utilities, and data integrity",
      },
      {
        label: "Playable 404 Game",
        description:
          "Zoro-themed sword game with grid navigation, move limits, Nami escalation, and accessibility fallback for reduced motion",
      },
      {
        label: "Built-in Documentation Viewer",
        description:
          "Renders project documentation from the repo with Mermaid diagram support, breadcrumb navigation, and syntax highlighting",
      },
      {
        label: "IP-Based Rate Limiting",
        description:
          "Middleware-level rate limiting on all API routes to prevent abuse, with configurable thresholds per endpoint",
      },
    ],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/strawhatluka/sunny-stack",
      },
      {
        label: "Live Site",
        url: "https://sunny-stack.com",
      },
    ],
    status: "active",
    footer: "v3.0.2 - 252 commits. Deployed on Vercel.",
  },
  {
    id: "rinoa-platform",
    title: "Rinoa",
    tagline:
      "Hybrid cloud-edge data platform for a proprietary client application",
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
      "Proprietary application - technical architecture and performance metrics showcased with client approval.",
  },

  // ─── Personal ─────────────────────────────────────────────────
  {
    id: "hytale-server-manager",
    title: "Hytale Server Manager",
    tagline:
      "Free, open-source desktop app wrapping Hytale dedicated servers with a clean UI",
    description:
      "Monitor server status, view connected players with their gear and stats, manage warps, toggle mods, and browse game assets - all from a single interface. Built with Electron's multi-process architecture and strict context isolation. 17 invoke + 13 event IPC channels, 7 Zustand stores, 18 React components, and 240+ tests across 17 suites.",
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
    tagline:
      "Unified productivity platform with Discord bot, REST API, and PWA",
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
          "Discord bot, REST API with JWT auth, and installable PWA - all sharing the same backend",
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
    tagline:
      "SaaS platform that turns industrial equipment photos into AI valuation reports",
    description:
      "Production SaaS platform for industrial machinery resale - upload photos and documents, receive a full valuation report in minutes. A two-phase Gemini 2.5 Flash pipeline handles equipment extraction (specs, condition, serial number pattern matching) then web-grounded market research (pricing, comparables, marketing copy), delivered by email and exportable as PDF. Built on Next.js 16 frontend on Vercel, Express backend on Fly.io, Supabase PostgreSQL with 8 RLS-enforced tables, Stripe subscription billing, and 754+ tests across 56 frontend test files.",
    category: "professional",
    techStack: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Supabase (PostgreSQL)",
      "Express",
      "Gemini 2.5 Flash",
      "Stripe",
      "Docker",
    ],
    features: [
      {
        label: "Two-Phase AI Pipeline",
        description:
          "Phase 1 extracts equipment type, make, model, year, serial number, specs, and condition via Gemini Vision; Phase 2 runs web-grounded market research for pricing, comparables, and ready-to-post marketing copy",
      },
      {
        label: "Single Machine Evaluation",
        description:
          "Upload photos and optional documents (PDF, DOCX, XLSX) for any piece of industrial equipment - AI identifies make, model, year, serial number, specs, and condition grade from visual evidence alone",
      },
      {
        label: "Stripe Credit Billing",
        description:
          "Free Trial and Basic subscription tiers with per-cycle credit resets, Stripe Checkout and Customer Portal, idempotent webhook processing, and a full credit transaction audit log",
      },
      {
        label: "PDF & Email Delivery",
        description:
          "Reports viewable in-app, exportable as PDF via @react-pdf/renderer, and emailed on completion with a branded Resend template",
      },
    ],
    links: [
      {
        label: "Live App",
        url: "https://stilltide.us",
      },
    ],
    status: "active",
    footer:
      "Live at stilltide.us - actively serving industrial equipment resellers.",
  },
  {
    id: "spotify-rainmeter",
    title: "Spotify Now Playing",
    tagline:
      "Lightweight Rainmeter skin for Windows displaying Spotify track info",
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
          "OAuth 2.0 tokens refresh automatically every ~55 minutes - set it and forget it",
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
      "Windows desktop enhancement - MIT licensed with 1-second real-time polling. Fully customizable colors, fonts, and layout.",
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
        label: "Merged PR #2788",
        url: "https://github.com/AmruthPillai/Reactive-Resume/pull/2788",
      },
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
      "Contributed to Reactive Resume - an open-source resume builder with 30k+ GitHub stars. Merged PR #2788.",
  },
  {
    id: "get-shit-done",
    title: "Get Shit Done (GSD)",
    tagline:
      "Documentation generation and verification system for AI-assisted development",
    description:
      "A documentation command for GSD that writes, updates, and verifies project docs against the actual codebase. Every factual claim - file paths, CLI commands, API endpoints, function signatures - is checked against the live repo before commit. Handles both initial doc creation and incremental updates, generating up to 9 documentation types with parallel subagent orchestration.",
    category: "contribution",
    techStack: ["JavaScript", "Node.js", "CommonJS", "Claude Agent SDK"],
    features: [
      {
        label: "Docs Verification Gate",
        description:
          "Filesystem-only fact-checking - extracts every claim from generated docs and validates against the live codebase. No hallucinated paths, no phantom endpoints, no stale signatures.",
      },
      {
        label: "9 Documentation Types",
        description:
          "Conditional generation of README, ARCHITECTURE, API, DEPLOYMENT, CONFIGURATION, GETTING-STARTED, DEVELOPMENT, TESTING, and CONTRIBUTING based on project signals",
      },
      {
        label: "4 Operating Modes",
        description:
          "Create, update, supplement, and fix modes with hand-written doc preservation - never overwrites human-authored content without explicit consent",
      },
      {
        label: "Parallel Subagent Orchestration",
        description:
          "2-wave parallel dispatch with gsd-doc-writer and gsd-doc-verifier agents, bounded fix loop with regression detection (max 2 iterations)",
      },
      {
        label: "Project Intelligence",
        description:
          "Automatic project type classification (CLI, SaaS, open source, monorepo), doc tooling detection (Docusaurus, VitePress, MkDocs), and recursive existing doc scanning",
      },
    ],
    links: [
      {
        label: "Merged PR #1532",
        url: "https://github.com/mckaywrigley/get-shit-done/pull/1532",
      },
      {
        label: "View Repo",
        url: "https://github.com/gsd-build/get-shit-done",
      },
    ],
    status: "active",
    footer:
      "Contributed to GSD - an AI workflow CLI for plan-execute-verify development. 2,559 lines across 9 files. Merged PR #1532.",
  },
];

export function getAllProjects(): ProjectData[] {
  return projects;
}

export function getProjectsByCategory(
  category: ProjectCategory,
): ProjectData[] {
  return projects.filter((p) => p.category === category);
}

export function getProjectById(id: string): ProjectData | undefined {
  return projects.find((p) => p.id === id);
}
