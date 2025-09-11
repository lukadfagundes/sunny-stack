'use client'

import { useState } from 'react'
import { Code2, Briefcase, GraduationCap, Wrench, ChevronRight, Download, Calendar, MapPin } from 'lucide-react'
import { generateResumePDF } from '@/lib/generateResumePDF'

export default function Resume() {
  const [activeSection, setActiveSection] = useState('skills')

  const handleDownloadPDF = () => {
    generateResumePDF();
  }

  const sections = [
    { id: 'skills', label: 'Technical Skills', icon: Code2 },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'journey', label: 'My Journey', icon: GraduationCap },
    { id: 'tools', label: 'Tools & Tech', icon: Wrench },
  ]

  const skills = {
    'Languages': ['TypeScript', 'JavaScript', 'Python', 'Dart', 'HTML/CSS', 'SQL'],
    'Frontend': ['React 19', 'Next.js 15', 'Flutter', 'Tailwind CSS', 'Framer Motion', 'Zustand', 'React Query'],
    'Backend': ['FastAPI', 'Flask', 'Node.js', 'Express', 'SQLAlchemy', 'Uvicorn'],
    'Database': ['PostgreSQL', 'SQLite', 'Redis', 'Cloudflare D1'],
    'Tools': ['Git', 'VS Code', 'Docker', 'Riverpod', 'GitHub API', 'JWT Auth'],
    'APIs & Integration': ['OpenAI API', 'REST APIs', 'WebSockets', 'OAuth 2.0', 'Tesseract OCR', 'JSON Web Tokens'],
  }

  const experience = [
    {
      title: 'Developer Experience',
      company: 'Building impressive projects without the job title',
      period: '2025 - Present',
      location: 'Salem, OR',
      highlights: [
        'Self-taught developer with 2 months of intensive full-stack development',
        'Built 3 production-ready applications using modern frameworks',
        'Ready to make it official? Let\'s talk.',
      ]
    },
    {
      title: 'Account Manager - Process Equipment',
      company: 'Revelation Machinery',
      period: '2021 - Present',
      location: 'Salem, OR (Remote)',
      highlights: [
        'Manage strategic partnerships and sales for industrial process equipment',
        'Consult with clients on equipment valuation and acquisition strategies',
        'Identified critical gaps in industry evaluation tools, inspiring tech solutions',
      ]
    },
    {
      title: 'Customer Service Representative',
      company: 'TEJ Agency',
      period: '2013 - 2020',
      location: 'Louisiana',
      highlights: [
        'Handled complex customer inquiries while maintaining 99% satisfaction rate',
        'Guided customers through technical web portal and online system issues',
        'Maintained compliance with company and federal regulations',
      ]
    },
    {
      title: 'Manager / Server',
      company: 'The Landing Restaurant',
      period: '2011 - 2020',
      location: 'Louisiana',
      highlights: [
        'Managed team of 30 employees during peak season operations',
        'Developed policies and standard operating procedures',
        'Recruited, trained, and mentored restaurant staff',
      ]
    },
  ]

  const journey = [
    { year: '2016', event: 'Started learning to code', description: 'First dive into programming, self-teaching the basics' },
    { year: '2020', event: 'Career crossroads', description: 'COVID-19 led to reevaluation of career path' },
    { year: '2021', event: 'Entered equipment sales', description: 'Started new career in manufacturing equipment' },
    { year: '2024', event: 'Moved to Oregon', description: 'New chapter in Salem, fresh start in the Pacific Northwest' },
    { year: '2025', event: 'Everything clicks', description: 'Got married, reignited coding passion, building real solutions' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto pt-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-sunny-gradient bg-clip-text text-transparent">
                Interactive Resume
              </span>
            </h1>
            <p className="text-lg text-sunny-brown/80 mb-6">
              Click sections below to explore my background
            </p>
            
            {/* Download Button */}
            <button 
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 bg-sunny-red hover:bg-sunny-darkRed text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>

          {/* Section Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-8 relative z-10">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all transform hover:scale-105 cursor-pointer ${
                    activeSection === section.id
                      ? 'bg-sunny-red text-white shadow-lg'
                      : 'bg-white/90 text-sunny-brown hover:bg-sunny-gold/20'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{section.label}</span>
                </button>
              )
            })}
          </div>

          {/* Content Sections */}
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 md:p-10 min-h-[500px]">
            {/* Skills Section */}
            {activeSection === 'skills' && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-sunny-darkRed mb-6">Technical Skills</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(skills).map(([category, items]) => (
                    <div key={category} className="bg-sunny-gold/10 rounded-lg p-4 border-2 border-sunny-gold/30">
                      <h3 className="font-bold text-sunny-red mb-3">{category}</h3>
                      <div className="space-y-2">
                        {items.map((skill) => (
                          <div key={skill} className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-sunny-gold" />
                            <span className="text-sunny-brown">{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Section */}
            {activeSection === 'experience' && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-sunny-darkRed mb-6">Professional Experience</h2>
                <div className="space-y-6">
                  {experience.map((job, index) => (
                    <div key={index} className="border-l-4 border-sunny-red pl-6 ml-2">
                      <div className="flex flex-wrap items-center gap-4 mb-2">
                        <h3 className="text-xl font-bold text-sunny-darkRed">{job.title}</h3>
                        <span className="text-sunny-brown font-medium">{job.company}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-sunny-brown/70 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {job.period}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {job.highlights.map((highlight, i) => (
                          <li key={i} className="text-sunny-brown/80 flex items-start gap-2">
                            <span className="text-sunny-gold mt-1">•</span>
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Journey Section */}
            {activeSection === 'journey' && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-sunny-darkRed mb-6">My Journey to Tech</h2>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-sunny-gold/30"></div>
                  
                  {/* Timeline items */}
                  <div className="space-y-8">
                    {journey.map((item, index) => (
                      <div key={index} className="flex gap-6">
                        <div className="relative">
                          <div className="w-20 h-16 bg-sunny-red rounded-full flex items-center justify-center text-white font-bold shadow-lg text-sm">
                            {item.year}
                          </div>
                        </div>
                        <div className="flex-1 pt-2">
                          <h3 className="text-lg font-bold text-sunny-darkRed mb-1">{item.event}</h3>
                          <p className="text-sunny-brown/80">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tools Section */}
            {activeSection === 'tools' && (
              <div className="animate-fadeIn">
                <h2 className="text-2xl font-bold text-sunny-darkRed mb-6">Tools & Technologies</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-sunny-red mb-4">Frontend Technologies</h3>
                    <div className="flex flex-wrap gap-3">
                      {['React 19', 'Next.js 15', 'Flutter', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Zustand', 'React Query'].map((tool) => (
                        <span key={tool} className="px-4 py-2 bg-sunny-gold/20 text-sunny-brown rounded-full border-2 border-sunny-gold/30">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-sunny-red mb-4">Backend Technologies</h3>
                    <div className="flex flex-wrap gap-3">
                      {['FastAPI', 'Flask', 'Node.js', 'Express', 'SQLAlchemy', 'JWT Auth', 'Tesseract OCR', 'OpenAI API'].map((tool) => (
                        <span key={tool} className="px-4 py-2 bg-sunny-ocean/20 text-sunny-brown rounded-full border-2 border-sunny-ocean/30">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-sunny-red mb-4">Database & Infrastructure</h3>
                    <div className="flex flex-wrap gap-3">
                      {['PostgreSQL', 'SQLite', 'Redis', 'Cloudflare', 'Docker', 'GitHub API', 'Riverpod', 'Git'].map((tool) => (
                        <span key={tool} className="px-4 py-2 bg-sunny-red/20 text-sunny-brown rounded-full border-2 border-sunny-red/30">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-sunny-red mb-4">Development Environment</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-sunny-brown/10">
                        <Code2 className="w-5 h-5 text-sunny-red" />
                        <span className="text-sunny-brown">VS Code with custom configurations</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-sunny-brown/10">
                        <Wrench className="w-5 h-5 text-sunny-red" />
                        <span className="text-sunny-brown">Windows + WSL2 + Git Bash</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}