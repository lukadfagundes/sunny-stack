'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Loading component for better UX
const QuoteLoader = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <div className="text-center">
      <div className="animate-pulse mb-4">
        <div className="h-8 w-48 bg-gray-800 rounded mx-auto mb-2"></div>
        <div className="h-4 w-32 bg-gray-800 rounded mx-auto"></div>
      </div>
      <p className="text-gray-200 mt-4">Loading quote system...</p>
    </div>
  </div>
)

// Dynamic import with code splitting
const QuoteContainer = dynamic(
  () => import('@/components/quote/QuoteContainer'),
  {
    loading: () => <QuoteLoader />,
    ssr: true // Enable SSR for SEO
  }
)

export default function QuotePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Suspense fallback={<QuoteLoader />}>
        <QuoteContainer />
      </Suspense>
    </main>
  )
}