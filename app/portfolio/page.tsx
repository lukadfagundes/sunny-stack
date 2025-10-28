'use client'

import { useState } from 'react'
import { Sparkles, Rocket, Compass, ChevronDown, Code2, Briefcase, ExternalLink, Zap, Users, GitBranch } from 'lucide-react'
import Link from 'next/link'

export default function Portfolio() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId)
  }

  return (
    <main className="bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20" style={{ minHeight: '100dvh' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto pt-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-sunny-gradient bg-clip-text text-transparent">
                Portfolio
              </span>
            </h1>
            <p className="text-lg text-sunny-brown/80">
              Personal passion projects & professional work
            </p>
          </div>

          {/* Project Cards Grid */}
          <div className="space-y-6">
            {/* Personal Projects Card */}
            <div
              className="bg-white/90 backdrop-blur border-2 border-sunny-gold/30 rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
            >
              <button
                onClick={() => toggleCard('personal')}
                className="w-full p-6 flex items-center justify-between hover:bg-sunny-gold/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sunny-gold/20 rounded-full flex items-center justify-center">
                    <Code2 className="w-6 h-6 text-sunny-orange" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold text-sunny-darkRed">Personal Projects</h2>
                    <p className="text-sm text-sunny-brown/60">Open-source tools & experiments</p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-sunny-brown/60 transition-transform duration-200 ${
                    expandedCard === 'personal' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  expandedCard === 'personal' ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6 pt-2 border-t border-sunny-gold/20">
                  {/* Projects List */}
                  <div className="space-y-6">
                  {/* Trinity Method SDK */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <GitBranch className="w-5 h-5 text-sunny-red mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-xl font-bold text-sunny-darkRed mb-2">Trinity Method SDK</h3>
                        <p className="text-sunny-brown/80 mb-4">
                          An innovative development methodology and toolkit designed to revolutionize AI-assisted coding.
                          Built specifically for Claude Code, Trinity Method brings structure, consistency, and systematic
                          approaches to AI-powered software development.
                        </p>
                      </div>
                    </div>

                    <div className="bg-sunny-cream/30 rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-sunny-red flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Key Features
                      </h4>
                      <ul className="space-y-2 text-sm text-sunny-brown/80">
                        <li className="flex items-start gap-2">
                          <span className="text-sunny-gold mt-1">•</span>
                          <span><strong>7 Specialized AI Agents</strong> - Each with distinct roles (ALY as CTO, AJ as Chief Code, etc.)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sunny-gold mt-1">•</span>
                          <span><strong>Investigation-First Methodology</strong> - Understand before implementing</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sunny-gold mt-1">•</span>
                          <span><strong>Automatic Quality Setup</strong> - Linting, pre-commit hooks, and quality gates</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sunny-gold mt-1">•</span>
                          <span><strong>Hierarchical Knowledge Base</strong> - Persistent learning across development sessions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sunny-gold mt-1">•</span>
                          <span><strong>Lightning-Fast Deployment</strong> - 49 components deployed in under 15 seconds</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-sunny-sky/10 rounded-lg p-4 border border-sunny-ocean/20">
                      <h4 className="font-semibold text-sunny-ocean mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Join the Development
                      </h4>
                      <p className="text-sm text-sunny-brown/80 mb-3">
                        Trinity Method SDK is open-source and actively seeking contributors! Whether you're working with
                        Claude Code, Cursor, Windsurf, or other AI coding assistants, your insights can help shape the
                        future of AI-assisted development.
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full">TypeScript</span>
                        <span className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full">AI Agents</span>
                        <span className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full">Dev Methodology</span>
                        <span className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full">CLI Tool</span>
                      </div>
                      <a
                        href="https://github.com/lukadfagundes/trinity-method-sdk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sunny-ocean hover:text-sunny-darkRed transition-colors font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on GitHub & Contribute
                      </a>
                    </div>

                    <div className="pt-2">
                      <p className="text-xs text-sunny-brown/60 italic">
                        💡 Get started: <code className="bg-sunny-brown/10 px-2 py-0.5 rounded text-sunny-red">npx @trinity-method/cli deploy</code>
                      </p>
                    </div>
                  </div>

                  {/* Bwaincell Discord Bot */}
                  <div className="space-y-4 pt-6 border-t border-sunny-gold/20">
                    <div className="flex items-start gap-3">
                      <GitBranch className="w-5 h-5 text-sunny-red mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-xl font-bold text-sunny-darkRed mb-2">Bwaincell - Personal Productivity API</h3>
                        <p className="text-sunny-brown/80 mb-4">
                          A comprehensive dual-purpose productivity platform combining Discord bot functionality with a RESTful API.
                          Features task management, lists, notes, reminders, budget tracking, and random generators—all accessible
                          via Discord slash commands and secure HTTP endpoints.
                        </p>
                      </div>
                    </div>

                    <div className="bg-sunny-cream/30 rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-sunny-red flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Key Features
                      </h4>
                      <ul className="space-y-2 text-sm text-sunny-brown/80">
                        <li className="flex items-start gap-2">
                          <span className="text-sunny-gold mt-1">•</span>
                          <span><strong>Dual Interface</strong> - Discord bot + REST API with Google OAuth 2.0</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sunny-gold mt-1">•</span>
                          <span><strong>Full Productivity Suite</strong> - Tasks, lists, notes, reminders, budget tracking</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sunny-gold mt-1">•</span>
                          <span><strong>Advanced Scheduling</strong> - One-time, daily, and weekly recurring reminders</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sunny-gold mt-1">•</span>
                          <span><strong>Production Ready</strong> - Deployed on Fly.io with Docker, comprehensive testing</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full">TypeScript</span>
                      <span className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full">Discord.js</span>
                      <span className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full">Express</span>
                      <span className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full">SQLite</span>
                      <span className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full">OAuth 2.0</span>
                    </div>

                    <a
                      href="https://github.com/lukadfagundes/bwaincell"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sunny-ocean hover:text-sunny-darkRed transition-colors font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on GitHub
                    </a>
                  </div>

                  {/* Bwain.app PWA */}
                  <div className="space-y-4 pt-6 border-t border-sunny-gold/20">
                    <div className="flex items-start gap-3">
                      <GitBranch className="w-5 h-5 text-sunny-red mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-xl font-bold text-sunny-darkRed mb-2">Bwain.app - Productivity PWA</h3>
                        <p className="text-sunny-brown/80 mb-4">
                          Modern Progressive Web App companion to Bwaincell, featuring Google OAuth authentication, offline support,
                          and a beautiful design inspired by "Your Name" (Kimi no Na wa). Installable on any device with full
                          cross-platform compatibility.
                        </p>
                      </div>
                    </div>

                    <div className="bg-sunny-cream/30 rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-sunny-red flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Key Features
                      </h4>
                      <ul className="space-y-2 text-sm text-sunny-brown/80">
                        <li className="flex items-start gap-2">
                          <span className="text-sunny-gold mt-1">•</span>
                          <span><strong>Progressive Web App</strong> - Installable, offline-capable, push notifications ready</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sunny-gold mt-1">•</span>
                          <span><strong>Modern Stack</strong> - Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sunny-gold mt-1">•</span>
                          <span><strong>Optimized Performance</strong> - 95+ Lighthouse score, PWA 100/100</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-sunny-gold mt-1">•</span>
                          <span><strong>Cross-Platform</strong> - Works on iOS, Android, Windows, macOS, Linux</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full">Next.js</span>
                      <span className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full">React</span>
                      <span className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full">TypeScript</span>
                      <span className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full">PWA</span>
                      <span className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full">NextAuth.js</span>
                    </div>

                    <div className="flex gap-3">
                      <a
                        href="https://bwain-app.vercel.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sunny-ocean hover:text-sunny-darkRed transition-colors font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Live App
                      </a>
                      <a
                        href="https://github.com/lukadfagundes/bwain.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sunny-ocean hover:text-sunny-darkRed transition-colors font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on GitHub
                      </a>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Projects Card */}
            <div
              className="bg-white/90 backdrop-blur border-2 border-sunny-red/30 rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
            >
              <button
                onClick={() => toggleCard('professional')}
                className="w-full p-6 flex items-center justify-between hover:bg-sunny-red/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sunny-red/20 rounded-full flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-sunny-red" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold text-sunny-darkRed">Professional Projects</h2>
                    <p className="text-sm text-sunny-brown/60">Client work & commercial ventures</p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-sunny-brown/60 transition-transform duration-200 ${
                    expandedCard === 'professional' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  expandedCard === 'professional' ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6 pt-2 border-t border-sunny-red/20">
                  {/* Empty State - IF I HAD ANY */}
                  <div className="text-center py-8">
                    <div className="max-w-md mx-auto">
                      <div className="mb-6 relative">
                        <div className="w-24 h-24 mx-auto bg-sunny-gold/20 rounded-full flex items-center justify-center">
                          <Sparkles className="w-12 h-12 text-sunny-gold" />
                        </div>
                        <div className="absolute -top-2 -right-8 text-4xl opacity-20 rotate-12">🏆</div>
                        <div className="absolute -bottom-2 -left-8 text-4xl opacity-20 -rotate-12">🏆</div>
                      </div>

                      <h3 className="text-xl font-bold text-sunny-darkRed mb-3">
                        This is where I'd put my client projects...
                      </h3>
                      <p className="text-lg text-sunny-brown/70 mb-2">
                        IF I HAD ANY!
                      </p>
                      <p className="text-sm text-sunny-brown/60 mb-6">
                        (But seriously, let's change that together)
                      </p>

                      <div className="border-t border-sunny-gold/30 pt-6">
                        <p className="text-sunny-brown/80 mb-4 text-sm">
                          <strong>Ready to be the first?</strong><br />
                          You'll get the VIP treatment, my undivided attention, and bragging rights as Client #1
                        </p>

                        <Link
                          href="/quote"
                          className="inline-flex items-center gap-2 bg-sunny-red hover:bg-sunny-darkRed text-white font-bold py-2.5 px-5 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        >
                          <Rocket className="w-4 h-4" />
                          Be My First Client
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden Easter Egg - Get Lost Button */}
          <div className="mt-8 pb-8 text-center">
            <p className="text-xs text-sunny-brown/40 mb-2">
              Psst... want to test my error handling?
            </p>
            <Link
              href="/three-sword-style/secret-technique/oni-giri"
              className="inline-flex items-center gap-2 text-sunny-brown/60 hover:text-sunny-red transition-colors group"
              title="Definitely the right way"
            >
              <Compass className="w-4 h-4 group-hover:animate-spin" />
              <span className="text-sm">Take the scenic route</span>
            </Link>
          </div>

          {/* Mobile scroll buffer - ensures content is scrollable on all devices */}
          <div className="md:hidden h-32" aria-hidden="true"></div>
        </div>
      </div>
    </main>
  )
}
