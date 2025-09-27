import { Code2, Rocket, Star } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const projects = [
    {
      title: "AI-Powered Business Platform",
      description: "Multi-tenant SaaS with OpenAI integration, OCR processing, and automated valuation algorithms.",
      tech: ["Flask", "FastAPI", "PostgreSQL", "GPT-4"],
      color: "border-sunny-gold"
    },
    {
      title: "Enterprise Desktop Application",
      description: "Cross-platform development tool with 22 backend services, real-time Git integration, and file system management.",
      tech: ["Flutter", "Dart", "GitHub API", "Riverpod"],
      color: "border-sunny-red"
    },
    {
      title: "Modern Portfolio Platform",
      description: "Full-stack web application with dynamic routing, interactive components, and automated PDF generation.",
      tech: ["Next.js 15", "React 19", "TypeScript", "Tailwind"],
      color: "border-sunny-ocean"
    }
  ]

  const skills = [
    { category: "Frontend", items: ["React 19", "Next.js 15", "Flutter", "TypeScript"] },
    { category: "Backend", items: ["FastAPI", "Flask", "Node.js", "PostgreSQL"] },
    { category: "Integration", items: ["OpenAI API", "GitHub API", "OCR", "JWT Auth"] }
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-ocean-gradient opacity-10"></div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          {/* Header */}
          <div className="text-center mb-16 pt-8">
            <div className="inline-block mb-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4">
                Hi, I'm <span className="bg-sunny-gradient bg-clip-text text-transparent">Luka</span>
              </h1>
              <div className="flex items-center justify-center gap-2 text-sunny-brown">
                <Code2 className="w-5 h-5" />
                <span className="text-lg font-medium">Full Stack Software Developer</span>
                <Rocket className="w-5 h-5" />
              </div>
            </div>

            <p className="text-xl text-sunny-brown/80 max-w-2xl mx-auto">
              Self-taught developer building
              <span className="font-semibold text-sunny-red"> production-ready applications</span> with
              modern frameworks and AI integration.
            </p>
          </div>

          {/* Featured Projects */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-sunny-darkRed">Featured Projects</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {projects.map((project, index) => (
                <div
                  key={index}
                  className={`bg-white/90 backdrop-blur border-2 ${project.color} p-6 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105`}
                >
                  <h3 className="text-lg font-bold text-sunny-darkRed mb-3">
                    {project.title}
                  </h3>
                  <p className="text-sm text-sunny-brown/70 mb-4">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-sunny-darkRed">Technical Skills</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {skills.map((skillGroup, index) => (
                <div key={index} className="bg-white/90 backdrop-blur p-6 rounded-lg border-2 border-sunny-gold/30">
                  <h3 className="font-bold text-sunny-red mb-4">{skillGroup.category}</h3>
                  <div className="space-y-2">
                    {skillGroup.items.map((skill, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-sunny-gold" />
                        <span className="text-sm text-sunny-brown">{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <p className="text-sunny-brown/70 mb-4">Have a cool project in mind?</p>
            <Link
              href="/quote"
              className="inline-flex items-center gap-2 bg-sunny-red hover:bg-sunny-darkRed text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Let's Talk About It
            </Link>
          </div>
        </div>
      </div>

      {/* Wave Pattern Bottom */}
      <svg className="absolute bottom-0 left-0 right-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120">
        <path
          fill="#7DD3FC"
          fillOpacity="0.1"
          d="M0,32L60,37.3C120,43,240,53,360,58.7C480,64,600,64,720,58.7C840,53,960,43,1080,48C1200,53,1320,75,1380,85.3L1440,96L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"
        />
      </svg>
    </main>
  )
}
