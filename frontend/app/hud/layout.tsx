import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cola Records HUD | Sunny Stack',
  description: 'Multi-project command center powered by Cola Records',
}

export default function HUDLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}