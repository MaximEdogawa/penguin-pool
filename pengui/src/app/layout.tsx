'use client'

import DashboardLayout from '@/components/DashboardLayout'
import ReactQueryProvider from '@/components/ReactQueryProvider'
import WalletConnectionGuard from '@/components/WalletConnectionGuard'
import { cn } from '@/lib/utils'
import { suppressRelayErrors } from '@/lib/walletConnect/utils/suppressRelayErrors'
import {
  WalletManager,
  persistor,
  restoreConnectionStateImmediate,
  store,
} from '@maximedogawa/chia-wallet-connect-react'
import { ThemeProvider } from 'next-themes'
import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import './globals.css'
// Import wallet connect package styles directly
// Using the package export path which maps to dist/styles/globals.css
import '@maximedogawa/chia-wallet-connect-react/styles'
import './wallet-connect.css'

// Suppress WalletConnect relay errors globally (non-critical internal SDK errors)
if (typeof window !== 'undefined') {
  suppressRelayErrors()
}

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

// Wallet metadata configuration (shared between WalletManager and restoreConnectionState)
const getWalletConnectConfig = () => {
  if (typeof window === 'undefined') {
    return {
      penguiIcon: '/pengui-logo.png',
      metadata: {
        name: 'Pengui',
        description: 'Penguin Pool - Decentralized lending platform on Chia Network',
        url: 'https://penguin.pool',
        icons: ['/pengui-logo.png'],
      },
    }
  }

  const penguiIcon = `${window.location.origin}/pengui-logo.png`
  return {
    penguiIcon,
    metadata: {
      name: 'Pengui',
      description: 'Penguin Pool - Decentralized lending platform on Chia Network',
      url: window.location.origin,
      icons: [penguiIcon],
    },
  }
}

export default function UILayout({ children }: { children: React.ReactNode }) {
  // Initialize WalletManager and database on mount
  useEffect(() => {
    const { penguiIcon, metadata } = getWalletConnectConfig()
    const walletManager = new WalletManager(penguiIcon, metadata)
    walletManager.detectEvents()

    // Initialize IndexedDB
    if (typeof window !== 'undefined') {
      import('@/lib/database/indexedDB').then(({ initializeDatabase }) => {
        initializeDatabase().catch(() => {
          // Database initialization failed, but continue anyway
        })
      })
    }
  }, [])

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
        className={cn(inter.variable, 'w-full overflow-x-hidden font-sans')}
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
        <Script
          id="suppress-walletconnect-warnings"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined' || typeof console === 'undefined') return;

                const originalWarn = console.warn.bind(console);
                const originalError = console.error.bind(console);

                const shouldSuppress = function(...args) {
                  // Combine all string arguments to check the full message
                  const fullMessage = args.map(arg => typeof arg === 'string' ? arg : String(arg)).join(' ');

                  // Check individual arguments too
                  for (let i = 0; i < args.length; i++) {
                    const arg = args[i];
                    const argStr = typeof arg === 'string' ? arg : String(arg);

                    // Match various patterns including numbers at the end
                    if (
                      argStr.includes('emitting session_ping') ||
                      argStr.includes('emitting session_request') ||
                      argStr.includes('without any listeners') ||
                      (argStr.includes('emitting') && argStr.includes('without')) ||
                      /emitting\\s+session_(ping|request)[:\\d\\s]+without/.test(argStr) ||
                      /emitting.*session_(ping|request).*without/.test(argStr) ||
                      // Match pattern with numbers: "emitting session_ping:1763247731881895 without any listeners 2176"
                      /emitting\\s+session_(ping|request):\\d+\\s+without/.test(argStr)
                    ) {
                      return true;
                    }
                  }

                  // Check the combined message
                  if (
                    fullMessage.includes('emitting session_ping') ||
                    fullMessage.includes('emitting session_request') ||
                    fullMessage.includes('without any listeners') ||
                    (fullMessage.includes('emitting') && fullMessage.includes('without')) ||
                    /emitting\\s+session_(ping|request)[:\\d\\s]+without/.test(fullMessage) ||
                    /emitting.*session_(ping|request).*without/.test(fullMessage) ||
                    /emitting\\s+session_(ping|request):\\d+\\s+without/.test(fullMessage)
                  ) {
                    return true;
                  }

                  return false;
                };

                console.warn = function(...args) {
                  if (shouldSuppress(...args)) {
                    return; // Suppress WalletConnect warnings
                  }
                  originalWarn.apply(console, args);
                };

                console.error = function(...args) {
                  if (shouldSuppress(...args)) {
                    return; // Suppress WalletConnect warnings
                  }
                  originalError.apply(console, args);
                };
              })();
            `,
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Provider store={store}>
            <PersistGate
              loading={null}
              persistor={persistor}
              onBeforeLift={async () => {
                // Restore connection state after Redux Persist has rehydrated
                // This ensures the connection is re-established after page refresh
                const { penguiIcon, metadata } = getWalletConnectConfig()
                await restoreConnectionStateImmediate({
                  walletConnectIcon: penguiIcon,
                  walletConnectMetadata: metadata,
                })
                // Ensure events are detected after restoration
                // Create a new WalletManager instance to detect events
                // (detectEvents reads from Redux store, so instance doesn't matter)
                const walletManager = new WalletManager(penguiIcon, metadata)
                await walletManager.detectEvents()
              }}
            >
              <div className="wallet-connect-scope">
                <WalletConnectionGuard>
                  <ReactQueryProvider>
                    <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
                  </ReactQueryProvider>
                </WalletConnectionGuard>
              </div>
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
