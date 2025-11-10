import { store } from '@chia/wallet-connect'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

/**
 * Hook to check if wallet is connected via @chia/wallet-connect
 * Checks Redux store for session data or connection flags
 * Uses both useSelector (reactive) and direct store check (fallback)
 */
export function useWalletConnection() {
  const [directCheck, setDirectCheck] = useState(false)

  // Use Redux selector to reactively check connection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectorConnected = useSelector((state: any) => {
    if (!state?.walletConnect) return false

    const walletState = state.walletConnect

    // Check for selectedSession (the active/selected session indicates connection)
    const hasSelectedSession =
      walletState.selectedSession &&
      typeof walletState.selectedSession === 'object' &&
      walletState.selectedSession !== null &&
      Object.keys(walletState.selectedSession).length > 0

    // Check for sessions array (if it has items, there's a connection)
    const hasSessions = Array.isArray(walletState.sessions) && walletState.sessions.length > 0

    // Check for selectedSession topic (primary indicator of active connection)
    const hasSelectedSessionTopic = Boolean(walletState.selectedSession?.topic)

    // Check for selectedFingerprint (indicates a wallet is selected/connected)
    // Empty object {} should not count as connected - need actual properties
    const hasSelectedFingerprint =
      walletState.selectedFingerprint &&
      typeof walletState.selectedFingerprint === 'object' &&
      walletState.selectedFingerprint !== null &&
      Object.keys(walletState.selectedFingerprint).length > 0

    return hasSelectedSession || hasSessions || hasSelectedSessionTopic || hasSelectedFingerprint
  })

  // Direct store check as fallback (runs after hydration)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkStore = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = store.getState() as any
        if (!state?.walletConnect) {
          setDirectCheck(false)
          return
        }

        const walletState = state.walletConnect

        // Check for selectedSession (the active/selected session indicates connection)
        const hasSelectedSession =
          walletState.selectedSession &&
          typeof walletState.selectedSession === 'object' &&
          walletState.selectedSession !== null &&
          Object.keys(walletState.selectedSession).length > 0

        // Check for sessions array (if it has items, there's a connection)
        const hasSessions = Array.isArray(walletState.sessions) && walletState.sessions.length > 0

        // Check for selectedSession topic
        const hasSelectedSessionTopic = Boolean(walletState.selectedSession?.topic)

        // Check for selectedFingerprint
        // Empty object {} should not count as connected - need actual properties
        const hasSelectedFingerprint =
          walletState.selectedFingerprint &&
          typeof walletState.selectedFingerprint === 'object' &&
          walletState.selectedFingerprint !== null &&
          Object.keys(walletState.selectedFingerprint).length > 0

        const hasConnection =
          hasSelectedSession || hasSessions || hasSelectedSessionTopic || hasSelectedFingerprint

        setDirectCheck(hasConnection)
      } catch {
        // Store not available yet
        setDirectCheck(false)
      }
    }

    // Check immediately and after a delay for hydration
    checkStore()
    const timer = setTimeout(checkStore, 300)

    // Subscribe to store changes
    const unsubscribe = store.subscribe(checkStore)

    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [])

  // Return true if either selector or direct check indicates connection
  const isConnected = selectorConnected || directCheck

  return { isConnected }
}
