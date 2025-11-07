import { Toaster } from '@/components/ui/sonner'
import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import ReactQueryProvider from '@/components/ReactQueryProvider'
import { WalletProvider } from '@/features/walletConnect'
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
        <Script
          id="disable-lit-dev-mode"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.litDisableBundleWarning = true;
              }
            `,
          }}
        />
        <ReactQueryProvider>
          <WalletProvider>{children}</WalletProvider>
        </ReactQueryProvider>
        <Toaster expand />
        <Analytics />
      </body>
    </html>
  )
}
