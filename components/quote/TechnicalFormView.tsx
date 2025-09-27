'use client'

import { ArrowLeft, Download, Code2, FileText, ChevronRight } from 'lucide-react'
import { TrinityDebugger } from '@/lib/trinity-debug'
import { downloadTechnicalTemplate } from '@/lib/quote-templates'

const debug = new TrinityDebugger('TechnicalFormView')

interface TechnicalFormViewProps {
  onSelectForm: () => void
  onBack: () => void
}

export default function TechnicalFormView({ onSelectForm, onBack }: TechnicalFormViewProps) {
  debug.entry('TechnicalFormView')

  const handleDownload = () => {
    debug.info('handleDownload', 'Downloading technical template')
    downloadTechnicalTemplate()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto pt-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sunny-brown hover:text-sunny-red transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-8">
            <div className="text-center mb-8">
              <Code2 className="w-16 h-16 text-sunny-ocean mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-sunny-darkRed mb-4">
                Technical Requirements
              </h2>
              <p className="text-sunny-brown/80">
                Choose how you'd like to provide your project specifications
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={onSelectForm}
                className="bg-sunny-ocean/10 backdrop-blur rounded-xl p-6 text-left hover:shadow-xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-sunny-ocean/30"
              >
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-6 h-6 text-sunny-ocean" />
                  <h3 className="font-bold text-sunny-darkRed">Fill Out Online</h3>
                </div>
                <p className="text-sm text-sunny-brown/80 mb-4">
                  Complete the comprehensive technical requirements form right here and submit directly.
                </p>
                <div className="flex items-center gap-2 text-sunny-ocean text-sm">
                  <span>Start Form</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              <button
                onClick={handleDownload}
                className="bg-sunny-gold/10 backdrop-blur rounded-xl p-6 text-left hover:shadow-xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-sunny-gold/30"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Download className="w-6 h-6 text-sunny-gold" />
                  <h3 className="font-bold text-sunny-darkRed">Download Template</h3>
                </div>
                <p className="text-sm text-sunny-brown/80 mb-4">
                  Get the PDF template to fill out offline and email back at your convenience.
                </p>
                <div className="flex items-center gap-2 text-sunny-gold text-sm">
                  <span>Download PDF</span>
                  <Download className="w-4 h-4" />
                </div>
              </button>
            </div>

            <div className="mt-8 p-4 bg-sunny-cream/50 rounded-lg text-center">
              <p className="text-sm text-sunny-brown/70">
                Questions? Email me directly at{' '}
                <a href="mailto:luka@sunny-stack.com" className="text-sunny-red hover:text-sunny-darkRed">
                  luka@sunny-stack.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
