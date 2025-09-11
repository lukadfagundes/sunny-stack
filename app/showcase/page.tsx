import { Sparkles, Compass } from 'lucide-react'
import Link from 'next/link'

export default function Showcase() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto pt-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-sunny-gradient bg-clip-text text-transparent">
                Showcase
              </span>
            </h1>
            <p className="text-lg text-sunny-brown/80">
              Interactive demos and mini-apps to explore
            </p>
          </div>

          {/* Coming Soon Section */}
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-12 text-center">
            <Sparkles className="w-16 h-16 text-sunny-gold mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-sunny-darkRed mb-4">
              Interactive Widgets Coming Soon!
            </h2>
            <p className="text-sunny-brown/80 max-w-2xl mx-auto mb-6">
              This space will feature interactive demonstrations of my work - mini-apps, 
              components, and tools you can play with right here in your browser.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="p-6 bg-sunny-gold/10 rounded-lg border-2 border-sunny-gold/30">
                <h3 className="font-bold text-sunny-darkRed mb-2">Todo App</h3>
                <p className="text-sm text-sunny-brown/70">
                  A sleek task manager with local storage
                </p>
              </div>
              <div className="p-6 bg-sunny-red/10 rounded-lg border-2 border-sunny-red/30">
                <h3 className="font-bold text-sunny-darkRed mb-2">Color Picker</h3>
                <p className="text-sm text-sunny-brown/70">
                  Advanced color selection with palette generation
                </p>
              </div>
              <div className="p-6 bg-sunny-ocean/10 rounded-lg border-2 border-sunny-ocean/30">
                <h3 className="font-bold text-sunny-darkRed mb-2">Calculator</h3>
                <p className="text-sm text-sunny-brown/70">
                  Beautiful calculator with history tracking
                </p>
              </div>
            </div>
            
            {/* Hidden Easter Egg - Get Lost Button */}
            <div className="mt-12 pt-8 border-t border-sunny-gold/20">
              <p className="text-xs text-sunny-brown/40 mb-4">
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
          </div>
        </div>
      </div>
    </main>
  )
}