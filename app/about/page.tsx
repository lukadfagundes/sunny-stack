import { Code2, Heart, Coffee, Cat, Music, Gamepad2, MapPin, Sparkles } from 'lucide-react'
import Image from 'next/image'

export default function About() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto pt-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-sunny-gradient bg-clip-text text-transparent">
                About Me
              </span>
            </h1>
            <p className="text-lg text-sunny-brown/80">
              Developer by day, anime enthusiast by night
            </p>
          </div>

          {/* Main About Section */}
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 md:p-10 mb-8">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-sunny-darkRed mb-4">Hey, I'm Luka! 👋</h2>
              
              <p className="text-sunny-brown/80 mb-4">
                My journey to Salem, OR has been quite the adventure. Born in Reno, moved to and raised in Louisiana 
                from 2001-2020, with a 4 year stint in Texas, I finally found my home in the beautiful Pacific Northwest in 2024. 
                And yes, I got married here too! My wife and I actually hiked to Abiqua Falls right after our 
                ceremony – because nothing says "just married" like a gorgeous Oregon waterfall hike.
              </p>

              <p className="text-sunny-brown/80 mb-4">
                My path to programming wasn't traditional. I spent a decade in the restaurant industry, waiting tables, 
                bartending, and managing, while also working in insurance, specializing in bank protection. When COVID 
                hit in 2020 I found myself at a crossroads and spent some time finding myself. After some time figuring things out, I landed in equipment 
                sales, where I discovered a real need for better tools to value and review machinery. That's when 
                programming went from a longtime interest to a burning passion.
              </p>

              <p className="text-sunny-brown/80 mb-4">
                I first started teaching myself to code back in 2016, but life had other plans. Now, the spark has 
                reignited stronger than ever, and everything just "clicks." I'm building the tools I wish I had, 
                learning something new every day, and loving every minute of it.
              </p>

              <p className="text-sunny-brown/80">
                When I'm not deep in code, you'll find me watching One Piece (I'm a huge fan, ask me about my 
                collection!), playing video games, or exploring Oregon's incredible nature spots. 
                Friday nights are for adventures and finding delicious food, Saturdays are for farmers markets, 
                thrift shops, and hikes, and Sundays? Pure relaxation and catching up on shows (Yellowjackets, anyone?).
              </p>
            </div>
          </div>

          {/* Fun Facts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Location */}
            <div className="bg-white/90 backdrop-blur p-6 rounded-lg border-2 border-sunny-gold/30">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-5 h-5 text-sunny-orange" />
                <h3 className="font-bold text-sunny-darkRed">Based In</h3>
              </div>
              <p className="text-sm text-sunny-brown/70">
                Salem, Oregon – where the waterfalls are plenty and the nature is stunning
              </p>
            </div>

            {/* Pets */}
            <div className="bg-white/90 backdrop-blur p-6 rounded-lg border-2 border-sunny-red/30">
              <div className="flex items-center gap-3 mb-3">
                <Cat className="w-5 h-5 text-sunny-red" />
                <h3 className="font-bold text-sunny-darkRed">Cat Dad</h3>
              </div>
              <p className="text-sm text-sunny-brown/70">
                Aly & AJ – one's a plastic-eating cuddle bug, the other's wanted for tax evasion
              </p>
            </div>

            {/* Music */}
            <div className="bg-white/90 backdrop-blur p-6 rounded-lg border-2 border-sunny-ocean/30">
              <div className="flex items-center gap-3 mb-3">
                <Music className="w-5 h-5 text-sunny-ocean" />
                <h3 className="font-bold text-sunny-darkRed">Soundtrack</h3>
              </div>
              <p className="text-sm text-sunny-brown/70">
                2000s emo, pop punk, video game OSTs, and anime openings on repeat
              </p>
            </div>

            {/* Gaming */}
            <div className="bg-white/90 backdrop-blur p-6 rounded-lg border-2 border-sunny-gold/30">
              <div className="flex items-center gap-3 mb-3">
                <Gamepad2 className="w-5 h-5 text-sunny-orange" />
                <h3 className="font-bold text-sunny-darkRed">Gamer</h3>
              </div>
              <p className="text-sm text-sunny-brown/70">
                Late night gaming sessions with the wife are the best kind of date night
              </p>
            </div>

            {/* Fuel */}
            <div className="bg-white/90 backdrop-blur p-6 rounded-lg border-2 border-sunny-red/30">
              <div className="flex items-center gap-3 mb-3">
                <Coffee className="w-5 h-5 text-sunny-red" />
                <h3 className="font-bold text-sunny-darkRed">Fuel</h3>
              </div>
              <p className="text-sm text-sunny-brown/70">
                Seltzer water is my new obsession (and spicy dill pickle Goldfish)
              </p>
            </div>

            {/* Night Owl */}
            <div className="bg-white/90 backdrop-blur p-6 rounded-lg border-2 border-sunny-ocean/30">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-sunny-ocean" />
                <h3 className="font-bold text-sunny-darkRed">Night Owl</h3>
              </div>
              <p className="text-sm text-sunny-brown/70">
                Best code happens after midnight, fueled by anime and snacks
              </p>
            </div>
          </div>

          {/* Interests & Passions */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-lg border-2 border-sunny-gold/30 mb-8">
            <h3 className="text-lg font-bold text-sunny-darkRed mb-4">Things That Light Me Up</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sunny-red mb-2">Obsessions</h4>
                <ul className="space-y-1 text-sm text-sunny-brown/70">
                  <li>• One Piece (seriously, it's a lifestyle)</li>
                  <li>• Building the perfect playlist</li>
                  <li>• Collecting silly coffee mugs</li>
                  <li>• Playing guitar (since I was 16!)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sunny-red mb-2">Favorite Artists</h4>
                <ul className="space-y-1 text-sm text-sunny-brown/70">
                  <li>• Mayday Parade</li>
                  <li>• Taking Back Sunday</li>
                  <li>• Chappell Roan</li>
                  <li>• Paramore & Radwimps</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Photo Section */}
          <div className="relative w-full h-[600px] mb-8 rounded-lg overflow-hidden shadow-xl">
            <Image
              src="/images/waterfall-photo.jpg.jpg"
              alt="Luka and his wife at Abiqua Falls"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Life Philosophy */}
          <div className="bg-white/90 backdrop-blur p-6 rounded-lg border-2 border-sunny-ocean/30 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-5 h-5 text-sunny-red" />
              <h3 className="text-lg font-bold text-sunny-darkRed">What Drives Me</h3>
            </div>
            <p className="text-sunny-brown/80 mb-3">
              The little joys in life keep me going. My wife and I eloped last June, and the dream of building 
              the life we deserve together, one where we can wake up and do what we love without worry, 
              that's what pushes me to keep learning, keep building, keep growing.
            </p>
            <p className="text-sm text-sunny-brown/70 italic">
              In five years? Picture this: our own home with a finished basement (my cave!), no alarm clocks, 
              just doing what we love. Oh, and dinner with Eiichiro Oda would be pretty cool too.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-sunny-brown/70 mb-4">
              Want to chat about code, One Piece theories, or the best waterfalls in Oregon?
            </p>
            <a 
              href="mailto:luka@sunny-stack.com"
              className="inline-flex items-center gap-2 bg-sunny-red hover:bg-sunny-darkRed text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Code2 className="w-5 h-5" />
              Let's Connect
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}