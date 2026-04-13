import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Luka Fagundes - Full Stack Developer",
  description:
    "Full stack developer based remotely in California. TypeScript, React, Node.js. Building since August 2025. One Piece fan. He/him.",
  openGraph: {
    title: "About Luka Fagundes - Full Stack Developer",
    description:
      "Full stack developer based remotely in California. TypeScript, React, Node.js. Building since August 2025. One Piece fan. He/him.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
