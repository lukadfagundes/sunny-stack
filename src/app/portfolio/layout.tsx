import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects - Luka Fagundes, Full Stack Developer",
  description:
    "Electron desktop apps, Discord bots, AI platforms, and open source contributions. Real production projects with merged PRs in Reactive Resume and GSD.",
  openGraph: {
    title: "Projects - Luka Fagundes, Full Stack Developer",
    description:
      "Electron desktop apps, Discord bots, AI platforms, and open source contributions. Real production projects with merged PRs in Reactive Resume and GSD.",
  },
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
