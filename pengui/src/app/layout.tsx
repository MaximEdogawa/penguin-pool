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
  manifest: '/manifest.json',
  themeColor: '#1e40af',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Penguin Pool',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  icons: {
    icon: [
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '167x167', type: 'image/png' },
    ],
  },
  other: {
    'application-name': 'Penguin Pool',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Penguin Pool',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#1e40af',
    'msapplication-tap-highlight': 'no',
    'msapplication-navbutton-color': '#1e40af',
  },
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
        <Analytics />
      </body>
    </html>
  )
}
