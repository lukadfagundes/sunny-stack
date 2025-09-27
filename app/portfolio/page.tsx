import { Sparkles, Rocket, Compass } from 'lucide-react'
import Link from 'next/link'

export default function Portfolio() {
  return (
    <main className="bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20" style={{ minHeight: '100dvh' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto pt-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-sunny-gradient bg-clip-text text-transparent">
                Client Portfolio
              </span>
            </h1>
            <p className="text-lg text-sunny-brown/80">
              Where amazing client projects will live
            </p>
          </div>

          {/* Empty State */}
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-6 relative">
                <div className="w-32 h-32 mx-auto bg-sunny-gold/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-16 h-16 text-sunny-gold" />
                </div>
                <div className="absolute -top-2 -right-12 text-6xl opacity-20 rotate-12">🏆</div>
                <div className="absolute -bottom-2 -left-12 text-6xl opacity-20 -rotate-12">🏆</div>
              </div>

              <h2 className="text-2xl font-bold text-sunny-darkRed mb-4">
                This is where I'd put my client projects...
              </h2>
              <p className="text-xl text-sunny-brown/70 mb-2">
                IF I HAD ANY!
              </p>
              <p className="text-sm text-sunny-brown/60 mb-8">
                (But seriously, let's change that together)
              </p>

              <div className="border-t border-sunny-gold/30 pt-8">
                <p className="text-sunny-brown/80 mb-6">
                  <strong>Ready to be the first?</strong><br />
                  You'll get the VIP treatment, my undivided attention, and bragging rights as Client #1
                </p>

                <Link
                  href="/quote"
                  className="inline-flex items-center gap-2 bg-sunny-red hover:bg-sunny-darkRed text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Rocket className="w-5 h-5" />
                  Be My First Client
                </Link>
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
