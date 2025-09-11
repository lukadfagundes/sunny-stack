import { Compass, MapPin, Home, Swords } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20 flex items-center justify-center">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Header */}
          <div className="mb-8">
            <h1 className="text-8xl md:text-9xl font-bold text-sunny-gold/30 mb-4">404</h1>
            <div className="relative">
              <Swords className="w-16 h-16 mx-auto text-sunny-red mb-4" />
              <Compass className="w-8 h-8 absolute top-0 right-1/3 text-sunny-brown/50 animate-spin-slow" />
            </div>
          </div>

          {/* Zoro Reference */}
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 md:p-10 mb-8">
            <h2 className="text-3xl font-bold text-sunny-darkRed mb-4">
              You Got Lost Again, Didn't You?
            </h2>
            <p className="text-xl text-sunny-brown/80 mb-6">
              Don't worry, it happens to the best swordsmen. This page seems to have wandered off 
              in a completely different direction... probably ended up at a sake shop.
            </p>
            
            <div className="border-t border-sunny-gold/30 pt-6 mb-6">
              <p className="text-sunny-brown/70 italic mb-2">
                "I'm not lost. The page is just in the wrong place."
              </p>
              <p className="text-sm text-sunny-brown/50">
                - Definitely not what Zoro would say
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sunny-brown/80">
                <strong>Marimo Navigation Tips:</strong>
              </p>
              <ul className="text-left max-w-md mx-auto space-y-2 text-sunny-brown/70">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-sunny-gold mt-1 flex-shrink-0" />
                  <span>Turn around 180° (you're probably going the wrong way)</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-sunny-gold mt-1 flex-shrink-0" />
                  <span>Follow literally anyone else but yourself</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-sunny-gold mt-1 flex-shrink-0" />
                  <span>The home page is NOT up those stairs to the left</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Navigation Options */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-sunny-red hover:bg-sunny-darkRed text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Home className="w-5 h-5" />
              Back to Home (Straight Ahead!)
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white hover:bg-sunny-cream text-sunny-brown font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border-2 border-sunny-gold/30"
            >
              <Compass className="w-5 h-5" />
              Get Directions (Contact)
            </Link>
          </div>

          <div className="mt-8 text-xs text-sunny-brown/40">
            Error 404: Page not found (but your sense of direction was lost long ago)
          </div>
        </div>
      </div>
    </main>
  )
}