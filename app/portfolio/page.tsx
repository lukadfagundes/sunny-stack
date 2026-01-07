"use client";

import { useState } from "react";
import {
  Sparkles,
  Rocket,
  Compass,
  ChevronDown,
  Code2,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { ProjectModal, ProjectData } from "@/components/portfolio/ProjectModal";
import { personalProjects, professionalProjects } from "./projects-data";

export default function Portfolio() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const openProjectModal = (project: ProjectData) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Delay clearing project to allow modal close animation
    setTimeout(() => setSelectedProject(null), 200);
  };

  return (
    <main
      className="bg-gradient-to-br from-sunny-cream via-white to-sunny-sky/20"
      style={{ minHeight: "100dvh" }}
    >
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
            <div className="bg-white/90 backdrop-blur border-2 border-sunny-gold/30 rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden">
              <button
                onClick={() => toggleCard("personal")}
                className="w-full p-6 flex items-center justify-between hover:bg-sunny-gold/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sunny-gold/20 rounded-full flex items-center justify-center">
                    <Code2 className="w-6 h-6 text-sunny-orange" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold text-sunny-darkRed">
                      Personal Projects
                    </h2>
                    <p className="text-sm text-sunny-brown/60">
                      Open-source tools & experiments
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-sunny-brown/60 transition-transform duration-200 ${
                    expandedCard === "personal" ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  expandedCard === "personal"
                    ? "max-h-[500px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-6 pt-2 border-t border-sunny-gold/20">
                  {/* Project Names List */}
                  <div className="space-y-2">
                    {personalProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => openProjectModal(project)}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-sunny-gold/10 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-sunny-red">{project.icon}</div>
                            <span className="text-sunny-darkRed font-medium group-hover:text-sunny-red transition-colors">
                              {project.title}
                            </span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-sunny-brown/40 -rotate-90 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Projects Card */}
            <div className="bg-white/90 backdrop-blur border-2 border-sunny-red/30 rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden">
              <button
                onClick={() => toggleCard("professional")}
                className="w-full p-6 flex items-center justify-between hover:bg-sunny-red/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sunny-red/20 rounded-full flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-sunny-red" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold text-sunny-darkRed">
                      Professional Projects
                    </h2>
                    <p className="text-sm text-sunny-brown/60">
                      Client work & commercial ventures
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-sunny-brown/60 transition-transform duration-200 ${
                    expandedCard === "professional" ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  expandedCard === "professional"
                    ? "max-h-[600px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-6 pt-2 border-t border-sunny-red/20">
                  {professionalProjects.length > 0 ? (
                    /* Project Names List */
                    <div className="space-y-2">
                      {professionalProjects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => openProjectModal(project)}
                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-sunny-red/10 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-sunny-red">
                                {project.icon}
                              </div>
                              <span className="text-sunny-darkRed font-medium group-hover:text-sunny-red transition-colors">
                                {project.title}
                              </span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-sunny-brown/40 -rotate-90 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Empty State - IF I HAD ANY */
                    <div className="text-center py-8">
                      <div className="max-w-md mx-auto">
                        <div className="mb-6 relative">
                          <div className="w-24 h-24 mx-auto bg-sunny-gold/20 rounded-full flex items-center justify-center">
                            <Sparkles className="w-12 h-12 text-sunny-gold" />
                          </div>
                          <div className="absolute -top-2 -right-8 text-4xl opacity-20 rotate-12">
                            🏆
                          </div>
                          <div className="absolute -bottom-2 -left-8 text-4xl opacity-20 -rotate-12">
                            🏆
                          </div>
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
                            <strong>Ready to be the first?</strong>
                            <br />
                            You'll get the VIP treatment, my undivided
                            attention, and bragging rights as Client #1
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
                  )}
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

      {/* Project Details Modal */}
      <ProjectModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </main>
  );
}
