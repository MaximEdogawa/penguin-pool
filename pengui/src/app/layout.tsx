'use client'

import { Inter } from 'next/font/google'
import Script from 'next/script'
import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { ThemeProvider } from 'next-themes'
import { usePathname } from 'next/navigation'
import { store, persistor, WalletManager } from '@chia/wallet-connect'
import '@chia/wallet-connect/styles'
import './globals.css'
import ReactQueryProvider from '@/components/ReactQueryProvider'
import WalletConnectionGuard from '@/components/WalletConnectionGuard'
import DashboardLayout from '@/components/DashboardLayout'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default function UILayout({ children }: { children: React.ReactNode }) {
  // On page reload, wallet event listeners need to be re-established
  // (i.e. if user disconnects from their wallet, the UI will update)
  useEffect(() => {
    // Initialize WalletManager with pengui icon
    const penguiIcon =
      typeof window !== 'undefined'
        ? `${window.location.origin}/penguin-pool.svg`
        : '/penguin-pool.svg'

    const walletManager = new WalletManager(penguiIcon, {
      name: 'Pengui',
      description: 'Penguin Pool - Decentralized lending platform on Chia Network',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://penguin.pool',
      icons: [penguiIcon],
    })
    walletManager.detectEvents()
  }, [])
  return (
    <html lang="en" className="font-extralight" suppressHydrationWarning>
      <head>
        <title>Penguin Pool | Decentralized Lending Platform</title>
        <meta
          name="description"
          content="Penguin Pool is a decentralized lending platform on Chia Network."
        />
        <meta name="theme-color" content="#1e40af" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Penguin Pool" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body className={cn(inter.className, 'w-full overflow-x-hidden')}>
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
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <WalletConnectionGuard>
                <ReactQueryProvider>
                  <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
                </ReactQueryProvider>
              </WalletConnectionGuard>
            </PersistGate>
          </Provider>
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
