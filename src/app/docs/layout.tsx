import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs — sunny-stack.com Developer Portfolio",
  description:
    "Complete technical documentation for sunny-stack: API reference, architecture diagrams, getting started guide, and deployment instructions.",
  openGraph: {
    title: "Docs — sunny-stack.com Developer Portfolio",
    description:
      "Complete technical documentation for sunny-stack: API reference, architecture diagrams, getting started guide, and deployment instructions.",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
