import type { Metadata } from "next";
import { Inter, Playfair_Display, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import ShipWheel from "@/components/ShipWheel";
import VoyageSail from "@/components/landing/VoyageSail";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Luka Fagundes — Full Stack Developer | sunny-stack.com",
    template: "%s | Luka Fagundes",
  },
  description:
    "Self-taught full stack developer building production software with TypeScript, React, Next.js, and Node.js. Based remotely. Open to full-time, contract, and freelance opportunities.",
  icons: { icon: "/favicon.png" },
  metadataBase: new URL("https://sunny-stack.com"),
  openGraph: {
    type: "website",
    siteName: "Luka Fagundes — Portfolio",
    title: "Luka Fagundes — Full Stack Developer",
    description:
      "Self-taught full stack developer. TypeScript, React, Next.js, Node.js.",
    url: "https://sunny-stack.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Luka Fagundes — Full Stack Developer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@strawhatluka",
  },
  verification: {
    google: "wzN3J4OUQyK1xqPzANPXOnyRVIMBtVMqdi_a4QWgtyk",
  },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Luka Fagundes",
  url: "https://sunny-stack.com",
  email: "luka@sunny-stack.com",
  jobTitle: "Full Stack Developer",
  description:
    "Self-taught full stack developer building production software with TypeScript, React, Next.js, and Node.js.",
  address: {
    "@type": "PostalAddress",
    addressRegion: "CA",
    addressCountry: "US",
  },
  sameAs: [
    "https://github.com/strawhatluka",
    "https://x.com/strawhatluka",
    "https://bsky.app/profile/strawhatluka.bsky.social",
    "https://www.youtube.com/@strawhatluka",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
          <VoyageSail />
          {children}
          <ShipWheel />
        </body>
    </html>
  );
}
