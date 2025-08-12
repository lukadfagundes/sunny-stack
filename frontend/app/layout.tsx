import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sunny Stack - Professional Software Development',
  description: 'Custom web applications and development solutions delivered fast',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon.svg',
        color: '#FFD700'
      }
    ]
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sunny-stack.com',
    siteName: 'Sunny Stack',
    title: 'Sunny Stack - Professional Software Development',
    description: 'Custom web applications delivered fast with modern technologies',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sunny Stack - Professional Software Development'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sunny Stack',
    description: 'Professional Software Development - Custom web applications delivered fast',
    images: ['/og-image.png']
  }
}

export const viewport = {
  themeColor: '#FFD700',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}