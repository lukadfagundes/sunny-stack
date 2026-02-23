/**
 * @file Portfolio Projects Data
 * @description Centralized project data for portfolio page
 */

import { GitBranch, ExternalLink } from "lucide-react";
import { ProjectData } from "@/components/portfolio/ProjectModal";

export const personalProjects: ProjectData[] = [
  {
    id: "bwaincell",
    icon: <GitBranch className="w-5 h-5" />,
    title: "Bwaincell - Unified Productivity Platform",
    description:
      "A monorepo productivity platform providing task management, reminders, lists, notes, budgets, scheduling, AI-powered suggestions, and random generators through three integrated interfaces: Discord Bot (10 slash commands with 49+ subcommands), REST API (39 authenticated endpoints), and Progressive Web App (Next.js 14).",
    keyFeatures: {
      title: "Key Features",
      items: [
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
    },
    callToAction: {
      title: "Open Source Productivity Platform",
      description:
        "Built for personal and household productivity with guild-based data sharing. 10 Discord slash commands, 39 REST API endpoints, and a full Next.js 14 PWA with offline support.",
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
      links: [
        {
          label: "View on GitHub",
          url: "https://github.com/lukadfagundes/bwaincell",
          icon: <ExternalLink className="w-4 h-4" />,
        },
      ],
    },
  },
  {
    id: "stilltide",
    icon: <GitBranch className="w-5 h-5" />,
    title: "Stilltide - AI Equipment Evaluation Platform",
    description:
      "Production AI platform that transforms equipment photos into professional valuation reports. Combines Gemini AI with Google Workspace integration for automated equipment analysis, market research, and comprehensive reporting—all delivered via email in minutes.",
    keyFeatures: {
      title: "Key Features",
      items: [
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
          description: "Vercel frontend + Fly.io Docker backend with JWT auth",
        },
      ],
    },
    techStack: [
      "React 19",
      "Vite",
      "Express",
      "Gemini AI",
      "Google APIs",
      "Docker",
    ],
    externalLinks: [
      {
        label: "Live App",
        url: "https://stilltide.sunny-stack.com",
        icon: <ExternalLink className="w-4 h-4" />,
      },
    ],
  },
  {
    id: "spotify-rainmeter",
    icon: <GitBranch className="w-5 h-5" />,
    title: "Spotify Now Playing - Rainmeter Skin",
    description:
      "Beautiful, lightweight Rainmeter skin for Windows that displays your currently playing Spotify track with full playback controls. Features automatic OAuth 2.0 token management, album artwork caching, and real-time updates with 1-second API polling.",
    keyFeatures: {
      title: "Key Features",
      items: [
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
    },
    callToAction: {
      title: "Open Source Project",
      description:
        "Includes SpotifySetup.exe GUI utility for easy OAuth configuration, comprehensive documentation, and full customization support. Built with security-first approach featuring local credential storage and minimal API scope requests.",
      techStack: [
        "Rainmeter",
        "Lua",
        "Python",
        "Spotify Web API",
        "OAuth 2.0",
        "PyInstaller",
      ],
      links: [
        {
          label: "View on GitHub",
          url: "https://github.com/lukadfagundes/spotify-skin-rainmeter",
          icon: <ExternalLink className="w-4 h-4" />,
        },
        {
          label: "Download on DeviantArt",
          url: "https://www.deviantart.com/strawhatluka/art/SpotifyNowPlaying-1-0-0-1275377835",
          icon: <ExternalLink className="w-4 h-4" />,
        },
      ],
    },
    footer:
      "💡 <strong>Windows Desktop Enhancement</strong> - MIT licensed open-source project with 1-second real-time polling for instant track updates. Fully customizable colors, fonts, and layout.",
  },
];

export const professionalProjects: ProjectData[] = [
  {
    id: "trinity-sdk",
    icon: <GitBranch className="w-5 h-5" />,
    title: "Trinity Method SDK",
    description:
      "An innovative development methodology and toolkit designed to revolutionize AI-assisted coding. Built specifically for Claude Code, Trinity Method brings structure, consistency, and systematic approaches to AI-powered software development.",
    keyFeatures: {
      title: "Key Features",
      items: [
        {
          label: "7 Specialized AI Agents",
          description:
            "Each with distinct roles (ALY as CTO, AJ as Chief Code, etc.)",
        },
        {
          label: "Investigation-First Methodology",
          description: "Understand before implementing",
        },
        {
          label: "Automatic Quality Setup",
          description: "Linting, pre-commit hooks, and quality gates",
        },
        {
          label: "Hierarchical Knowledge Base",
          description: "Persistent learning across development sessions",
        },
        {
          label: "Lightning-Fast Deployment",
          description: "49 components deployed in under 15 seconds",
        },
      ],
    },
    callToAction: {
      title: "Join the Development",
      description:
        "Trinity Method SDK is open-source and actively seeking contributors! Whether you're working with Claude Code, Cursor, Windsurf, or other AI coding assistants, your insights can help shape the future of AI-assisted development.",
      techStack: ["TypeScript", "AI Agents", "Dev Methodology", "CLI Tool"],
      links: [
        {
          label: "View on GitHub & Contribute",
          url: "https://github.com/lukadfagundes/trinity-method-sdk",
          icon: <ExternalLink className="w-4 h-4" />,
        },
      ],
    },
    footer:
      '💡 Get started: <code class="bg-sunny-brown/10 px-2 py-0.5 rounded text-sunny-red">npx @trinity-method/cli deploy</code>',
  },
  {
    id: "cola-records",
    icon: <GitBranch className="w-5 h-5" />,
    title: "Cola Records - Developer Contribution Manager",
    description:
      "Electron desktop application for managing developer contributions to open-source projects. Features issue discovery, contribution tracking, built-in Git operations, an embedded IDE via Docker-hosted code-server, multi-tab terminal, Spotify integration, and a dashboard with real-time GitHub activity.",
    keyFeatures: {
      title: "Key Features",
      items: [
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
    },
    callToAction: {
      title: "Open Source Desktop App",
      description:
        "108 React components, 15 main process services, and 163 IPC channels powering a full-featured desktop development environment. Cross-platform builds for Windows, macOS, and Linux with automatic updates via GitHub Releases.",
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
      links: [
        {
          label: "View on GitHub",
          url: "https://github.com/lukadfagundes/cola-records",
          icon: <ExternalLink className="w-4 h-4" />,
        },
      ],
    },
    footer:
      "Available as NSIS installer (Windows), DMG (macOS), and AppImage/deb/rpm (Linux) with auto-updates via electron-updater.",
  },
  {
    id: "rinoa-platform",
    icon: <GitBranch className="w-5 h-5" />,
    title: "Rinoa - Hybrid Cloud-Edge Data Platform",
    description:
      "Production-grade hybrid cloud-edge platform built for a proprietary client application. Combines Vercel serverless frontend with Raspberry Pi 5 edge computing backend, managing 13,000+ database records with sub-3ms query performance and 99.9% uptime.",
    keyFeatures: {
      title: "Technical Achievements",
      items: [
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
    },
    callToAction: {
      title: "Architecture Highlights",
      description:
        "Production deployment features automated scheduling, comprehensive error handling, email notifications, and intelligent data comparison systems. Built using Trinity Method v2.0 investigation-first development methodology.",
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
      links: [],
    },
    footer:
      "🔒 <strong>Proprietary Application</strong> - Technical architecture and performance metrics showcased with client approval. Specific business logic and data processing methods remain confidential.",
  },
];
