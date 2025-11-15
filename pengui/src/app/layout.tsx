'use client'

import DashboardLayout from '@/components/DashboardLayout'
import ReactQueryProvider from '@/components/ReactQueryProvider'
import { cn } from '@/lib/utils'
import { ThemeProvider } from 'next-themes'
import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default function UILayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-extralight" suppressHydrationWarning>
      <head>
        <title>Pengui | Premium Financial Intelligence</title>
        <meta
          name="description"
          content="Pengui - Premium Financial Intelligence. Decentralized lending platform on Chia Network."
        />
        <meta name="theme-color" content="#1e40af" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pengui" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body
        className={cn(inter.className, 'w-full overflow-x-hidden')}
        style={{ width: '100vw', maxWidth: '100vw', margin: 0, padding: 0, borderRight: 'none' }}
      >
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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ReactQueryProvider>
            <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login' || pathname === '/'

  if (isLoginPage) {
    return <>{children}</>
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
