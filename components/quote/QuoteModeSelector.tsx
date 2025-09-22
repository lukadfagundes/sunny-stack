'use client'

import { Users, Code2, ChevronRight, Download } from 'lucide-react'
import { TrinityDebugger } from '@/lib/trinity-debug'
import type { FormMode } from '@/lib/quote-types'

const debug = new TrinityDebugger('QuoteModeSelector')

interface QuoteModeSelectorProps {
  onModeSelect: (mode: FormMode) => void
}

export default function QuoteModeSelector({ onModeSelect }: QuoteModeSelectorProps) {
  debug.entry('QuoteModeSelector')

  const handleSelect = (mode: FormMode) => {
    debug.info('handleSelect', 'Mode selected', { mode })
    onModeSelect(mode)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-sunny-gradient bg-clip-text text-transparent">
                Let's Build Something Amazing
              </span>
            </h1>
            <p className="text-lg text-sunny-brown/80">
              Choose how you'd like to describe your project
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Guided Option */}
            <button
              onClick={() => handleSelect('guided')}
              className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-8 text-left hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-sunny-gold/30 group"
              aria-label="Start guided quote process"
            >
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-8 h-8 text-sunny-red" />
                <h2 className="text-xl font-bold text-sunny-darkRed">I'll Walk You Through It</h2>
              </div>
              <p className="text-sunny-brown/80 mb-4">
                Perfect if you're not sure about all the technical details. I'll ask simple questions
                to understand your vision.
              </p>
              <div className="flex items-center gap-2 text-sunny-red group-hover:gap-3 transition-all">
                <span className="text-sm font-medium">Start Guided Process</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {/* Technical Option */}
            <button
              onClick={() => handleSelect('technical')}
              className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-8 text-left hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-sunny-ocean/30 group"
              aria-label="Start technical quote process"
            >
              <div className="flex items-center gap-3 mb-4">
                <Code2 className="w-8 h-8 text-sunny-ocean" />
                <h2 className="text-xl font-bold text-sunny-darkRed">I Know What I Need</h2>
              </div>
              <p className="text-sunny-brown/80 mb-4">
                For those who speak tech. Download a technical requirements document to fill out
                with all the specifics.
              </p>
              <div className="flex items-center gap-2 text-sunny-ocean group-hover:gap-3 transition-all">
                <span className="text-sm font-medium">Get Technical Doc</span>
                <Download className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}