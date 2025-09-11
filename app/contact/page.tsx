import { Mail, Phone, MapPin, Linkedin, Clock, Send } from 'lucide-react'
import Link from 'next/link'

export default function Contact() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto pt-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-sunny-gradient bg-clip-text text-transparent">
                Let's Connect
              </span>
            </h1>
            <p className="text-lg text-sunny-brown/80">
              Ready to discuss opportunities? I'd love to hear from you.
            </p>
          </div>

          {/* Contact Cards Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Direct Contact Card */}
            <div className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-sunny-darkRed mb-4">Direct Contact</h2>
              
              <div className="space-y-4">
                <a 
                  href="mailto:luka@sunnystack.com"
                  className="flex items-start gap-3 group hover:text-sunny-red transition-colors"
                >
                  <Mail className="w-5 h-5 text-sunny-red mt-1" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-sunny-brown/70 group-hover:text-sunny-red">
                      luka@sunnystack.com
                    </p>
                  </div>
                </a>

                <a 
                  href="tel:318-332-9700"
                  className="flex items-start gap-3 group hover:text-sunny-red transition-colors"
                >
                  <Phone className="w-5 h-5 text-sunny-red mt-1" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-sunny-brown/70 group-hover:text-sunny-red">
                      (318) 332-9700
                    </p>
                  </div>
                </a>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-sunny-red mt-1" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-sunny-brown/70">
                      Salem, Oregon<br />
                      <span className="text-xs">Remote opportunities preferred</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Availability Card */}
            <div className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-sunny-darkRed mb-4">Availability</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-sunny-red mt-1" />
                  <div>
                    <p className="font-medium">Response Time</p>
                    <p className="text-sm text-sunny-brown/70">
                      Usually within 24 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Send className="w-5 h-5 text-sunny-red mt-1" />
                  <div>
                    <p className="font-medium">Status</p>
                    <p className="text-sm text-sunny-brown/70">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Open to opportunities
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Linkedin className="w-5 h-5 text-sunny-red mt-1" />
                  <div>
                    <p className="font-medium">LinkedIn</p>
                    <a 
                      href="https://www.linkedin.com/in/jason-fagundes-54785a102/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-sunny-brown/70 hover:text-sunny-red transition-colors"
                    >
                      Connect on LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What I'm Looking For */}
          <div className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-sunny-darkRed mb-6">What I'm Looking For</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-sunny-red mb-3">Ideal Opportunities</h3>
                <ul className="space-y-2 text-sunny-brown/80">
                  <li className="flex items-start gap-2">
                    <span className="text-sunny-gold mt-1">•</span>
                    <span>Full-stack development roles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sunny-gold mt-1">•</span>
                    <span>Frontend-focused positions with React/Next.js</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sunny-gold mt-1">•</span>
                    <span>Projects involving AI/ML integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sunny-gold mt-1">•</span>
                    <span>Remote or hybrid positions</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-sunny-red mb-3">What I Bring</h3>
                <ul className="space-y-2 text-sunny-brown/80">
                  <li className="flex items-start gap-2">
                    <span className="text-sunny-gold mt-1">•</span>
                    <span>Fresh perspective and enthusiasm</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sunny-gold mt-1">•</span>
                    <span>Strong business and customer service background</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sunny-gold mt-1">•</span>
                    <span>Self-directed learning ability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sunny-gold mt-1">•</span>
                    <span>Problem-solving mindset</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-sunny-gold/20 rounded-xl p-8 border-2 border-sunny-gold/30">
            <h2 className="text-2xl font-bold text-sunny-darkRed mb-4">
              Ready to Work Together?
            </h2>
            <p className="text-sunny-brown/80 mb-6 max-w-2xl mx-auto">
              Whether you have a full-time position, contract work, or just want to chat about 
              potential opportunities, I'm always happy to connect.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:luka@sunnystack.com"
                className="inline-flex items-center gap-2 bg-sunny-red hover:bg-sunny-darkRed text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <Mail className="w-5 h-5" />
                Send Email
              </a>
              <Link
                href="/resume"
                className="inline-flex items-center gap-2 bg-white hover:bg-sunny-cream text-sunny-brown font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border-2 border-sunny-gold/30"
              >
                View Resume
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}