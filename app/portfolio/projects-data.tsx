/**
 * @file Portfolio Projects Data
 * @description Centralized project data for portfolio page
 */

import { GitBranch, ExternalLink } from "lucide-react";
import { ProjectData } from "@/components/portfolio/ProjectModal";

export const personalProjects: ProjectData[] = [
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
    id: "bwaincell",
    icon: <GitBranch className="w-5 h-5" />,
    title: "Bwaincell - Personal Productivity API",
    description:
      "A comprehensive dual-purpose productivity platform combining Discord bot functionality with a RESTful API. Features task management, lists, notes, reminders, budget tracking, and random generators—all accessible via Discord slash commands and secure HTTP endpoints.",
    keyFeatures: {
      title: "Key Features",
      items: [
        {
          label: "Dual Interface",
          description: "Discord bot + REST API with Google OAuth 2.0",
        },
        {
          label: "Full Productivity Suite",
          description: "Tasks, lists, notes, reminders, budget tracking",
        },
        {
          label: "Advanced Scheduling",
          description: "One-time, daily, and weekly recurring reminders",
        },
        {
          label: "Production Ready",
          description: "Deployed on Fly.io with Docker, comprehensive testing",
        },
      ],
    },
    techStack: ["TypeScript", "Discord.js", "Express", "SQLite", "OAuth 2.0"],
    externalLinks: [
      {
        label: "View on GitHub",
        url: "https://github.com/lukadfagundes/bwaincell",
        icon: <ExternalLink className="w-4 h-4" />,
      },
    ],
  },
  {
    id: "bwain-app",
    icon: <GitBranch className="w-5 h-5" />,
    title: "Bwain.app - Productivity PWA",
    description:
      'Modern Progressive Web App companion to Bwaincell, featuring Google OAuth authentication, offline support, and a beautiful design inspired by "Your Name" (Kimi no Na wa). Installable on any device with full cross-platform compatibility.',
    keyFeatures: {
      title: "Key Features",
      items: [
        {
          label: "Progressive Web App",
          description: "Installable, offline-capable, push notifications ready",
        },
        {
          label: "Modern Stack",
          description:
            "Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui",
        },
        {
          label: "Optimized Performance",
          description: "95+ Lighthouse score, PWA 100/100",
        },
        {
          label: "Cross-Platform",
          description: "Works on iOS, Android, Windows, macOS, Linux",
        },
      ],
    },
    techStack: ["Next.js", "React", "TypeScript", "PWA", "NextAuth.js"],
    externalLinks: [
      {
        label: "Live App",
        url: "https://bwain-app.vercel.app",
        icon: <ExternalLink className="w-4 h-4" />,
      },
      {
        label: "View on GitHub",
        url: "https://github.com/lukadfagundes/bwain.app",
        icon: <ExternalLink className="w-4 h-4" />,
      },
    ],
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
  {
    id: "hytale-server-manager",
    icon: <GitBranch className="w-5 h-5" />,
    title: "Hytale Server Manager",
    description:
      "Desktop application built with Electron that enables users to manage Hytale dedicated game servers from a unified graphical interface. Features real-time log monitoring, player administration, mod configuration, and automatic updates—eliminating the need for command-line operations.",
    keyFeatures: {
      title: "Key Features",
      items: [
        {
          label: "Server Management",
          description:
            "Start/stop servers with real-time log monitoring and ANSI color support",
        },
        {
          label: "Player Administration",
          description:
            "View connected players with expandable cards displaying inventory, armor, tools, and statistics",
        },
        {
          label: "Mod Configuration",
          description:
            "Toggle server modifications with server-state awareness and live reloading",
        },
        {
          label: "Auto-Update System",
          description:
            "Checks GitHub Releases for updates, downloads in background, and installs with restart",
        },
        {
          label: "Comprehensive Testing",
          description:
            "17 test suites with 240+ tests covering main process, parsers, stores, and UI components",
        },
      ],
    },
    techStack: [
      "Electron 40",
      "React 19",
      "TypeScript",
      "Zustand",
      "Tailwind CSS",
      "Vite",
      "Jest",
    ],
    externalLinks: [
      {
        label: "View on GitHub",
        url: "https://github.com/lukadfagundes/hytale-server-manager",
        icon: <ExternalLink className="w-4 h-4" />,
      },
    ],
  },
  {
    id: "cola-records",
    icon: <GitBranch className="w-5 h-5" />,
    title: "Cola Records - Open Source Contribution Hub",
    description:
      "Desktop application that streamlines open-source contribution workflows by centralizing issue discovery, development work, and community interaction in a single unified interface. Features an embedded IDE, built-in Git operations, and integrations with Spotify and Discord.",
    keyFeatures: {
      title: "Key Features",
      items: [
        {
          label: "Issue Discovery",
          description:
            "Search GitHub for beginner-friendly contributions across repositories with smart filtering",
        },
        {
          label: "Embedded IDE",
          description:
            "Built-in code-server (VS Code in Docker) for development without leaving the app",
        },
        {
          label: "Git Workflow Integration",
          description:
            "Native branching, commits, and push operations with fork and clone tracking",
        },
        {
          label: "Multi-Tab Terminal",
          description:
            "Support for Git Bash, PowerShell, CMD, and SSH remote connections",
        },
      ],
    },
    techStack: [
      "Electron",
      "React",
      "TypeScript",
      "SQLite",
      "Docker",
      "code-server",
    ],
    externalLinks: [
      {
        label: "View on GitHub",
        url: "https://github.com/lukadfagundes/cola-records",
        icon: <ExternalLink className="w-4 h-4" />,
      },
    ],
  },
];

export const professionalProjects: ProjectData[] = [
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
