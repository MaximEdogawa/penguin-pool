'use client'

import { useWalletConnection } from '@/hooks/useWalletConnection'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * WalletConnectionGuard - Route guard that handles redirects based on wallet connection state
 * - If connected and on login page → redirect to dashboard
 * - If not connected and not on login page → redirect to login (protects all routes)
 * Works on initial load and page refresh
 */
export default function WalletConnectionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isConnected } = useWalletConnection()
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for Redux store to rehydrate from persistence
  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 200)
    return () => clearTimeout(timer)
  }, [])

  // Handle redirects based on connection state
  useEffect(() => {
    if (!isHydrated) return

    const isLoginPage = pathname === '/login'

    // If connected and on login page → redirect to dashboard
    if (isConnected && isLoginPage) {
      router.replace('/dashboard')
      return
    }

    // If not connected and not on login page → redirect to login (protect all routes)
    if (!isConnected && !isLoginPage) {
      // Use window.location for more forceful redirect if router doesn't work
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      } else {
        router.replace('/login')
      }
    }
  }, [isConnected, isHydrated, pathname, router])

  // Show loading state while checking connection (prevents flash of wrong page)
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
