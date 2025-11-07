import { Toaster } from '@/components/ui/sonner'
import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ReactQueryProvider from '@/components/ReactQueryProvider'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Penguin Pool | Decentralized Lending Platform',
  description: 'Penguin Pool is a decentralized lending platform on Chia Network.',
}

export default function UILayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark font-extralight">
      <body className={cn(inter.className, 'max-w-screen overflow-x-hidden')}>
        <ReactQueryProvider>{children}</ReactQueryProvider>
        <Toaster expand />
        <Analytics />
      </body>
    </html>
  )
}
