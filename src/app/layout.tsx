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
  title: "Luka Fagundes — Portfolio",
  description:
    "Full-stack developer portfolio — interactive experience showcasing projects, skills, and personality.",
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
      <body className="min-h-full flex flex-col">
          <VoyageSail />
          {children}
          <ShipWheel />
        </body>
    </html>
  );
}
