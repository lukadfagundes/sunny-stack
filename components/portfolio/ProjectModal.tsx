"use client";

/**
 * @file ProjectModal Component
 * @description Modal for displaying full project details
 * @module components/portfolio/ProjectModal
 */

import React, { useEffect } from "react";
import { X, Zap, Users, ExternalLink, Github } from "lucide-react";

export interface ProjectData {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  keyFeatures?: {
    title: string;
    items: Array<{
      label: string;
      description: string;
    }>;
  };
  callToAction?: {
    title: string;
    description: string;
    techStack: string[];
    links: Array<{
      label: string;
      url: string;
      icon?: React.ReactNode;
    }>;
  };
  techStack?: string[];
  externalLinks?: Array<{
    label: string;
    url: string;
    icon?: React.ReactNode;
  }>;
  footer?: string;
}

interface ProjectModalProps {
  project: ProjectData | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ProjectModal Component
 *
 * Displays full project details in a modal overlay
 *
 * @param props.project - Project data to display
 * @param props.isOpen - Whether modal is open
 * @param props.onClose - Close handler
 */
export function ProjectModal({ project, isOpen, onClose }: ProjectModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-sunny-cream/50 transition-colors z-10"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-sunny-brown" />
            </button>

            {/* Content */}
            <div className="p-8">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="text-sunny-red mt-1 flex-shrink-0">
                  {project.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-sunny-darkRed mb-2">
                    {project.title}
                  </h2>
                  <p className="text-sunny-brown/80">{project.description}</p>
                </div>
              </div>

              {/* Key Features */}
              {project.keyFeatures && (
                <div className="bg-sunny-cream/30 rounded-lg p-4 space-y-3 mb-4">
                  <h3 className="font-semibold text-sunny-red flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    {project.keyFeatures.title}
                  </h3>
                  <ul className="space-y-2 text-sm text-sunny-brown/80">
                    {project.keyFeatures.items.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-sunny-gold mt-1">•</span>
                        <span>
                          <strong>{item.label}</strong> - {item.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Call to Action */}
              {project.callToAction && (
                <div className="bg-sunny-sky/10 rounded-lg p-4 border border-sunny-ocean/20 mb-4">
                  <h3 className="font-semibold text-sunny-ocean mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {project.callToAction.title}
                  </h3>
                  <p className="text-sm text-sunny-brown/80 mb-3">
                    {project.callToAction.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {project.callToAction.techStack.map((tech, index) => (
                      <span
                        key={index}
                        className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {project.callToAction.links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sunny-ocean hover:text-sunny-darkRed transition-colors font-medium"
                      >
                        {link.icon || <ExternalLink className="w-4 h-4" />}
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tech Stack (standalone) */}
              {project.techStack && !project.callToAction && (
                <div className="mb-4">
                  <h3 className="font-semibold text-sunny-darkRed mb-2">
                    Tech Stack
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech, index) => (
                      <span
                        key={index}
                        className="text-xs px-3 py-1 bg-sunny-gold/20 text-sunny-brown rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* External Links (standalone) */}
              {project.externalLinks && !project.callToAction && (
                <div className="mb-4">
                  <h3 className="font-semibold text-sunny-darkRed mb-2">
                    Links
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {project.externalLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sunny-ocean hover:text-sunny-darkRed transition-colors font-medium"
                      >
                        {link.icon || <ExternalLink className="w-4 h-4" />}
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              {project.footer && (
                <div className="pt-4 border-t border-sunny-gold/20">
                  <p
                    className="text-xs text-sunny-brown/60 italic"
                    dangerouslySetInnerHTML={{ __html: project.footer }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
