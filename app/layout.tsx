// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Hackathon Hub',
  description: 'Team project tracker for the AI Hackathon',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  )
}
