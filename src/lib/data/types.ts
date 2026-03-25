/**
 * V3 Portfolio Data Types
 * Pure TypeScript — no React imports.
 */

export type ProjectCategory = "professional" | "personal" | "contribution";

export interface ProjectLink {
  label: string;
  url: string;
}

export interface ProjectFeature {
  label: string;
  description: string;
}

export interface ProjectData {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: ProjectCategory;
  techStack: string[];
  features: ProjectFeature[];
  links: ProjectLink[];
  status: "active" | "archived" | "proprietary";
  footer?: string;
}
