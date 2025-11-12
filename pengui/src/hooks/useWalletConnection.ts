import { useAppSelector } from '@chia/wallet-connect'
import { useEffect, useState } from 'react'

/**
 * Hook to check if wallet is connected via @chia/wallet-connect
 * Uses the package's useAppSelector to read connection status from Redux store
 */
export function useWalletConnection() {
  const [directCheck, setDirectCheck] = useState(false)

  // Use the package's useAppSelector hook to check connection status
  const selectedSession = useAppSelector((state) => state.walletConnect.selectedSession)
  const connectedWallet = useAppSelector((state) => state.wallet.connectedWallet)

  // Check if wallet is actually connected
  const selectorConnected =
    connectedWallet === 'WalletConnect' &&
    selectedSession !== null &&
    selectedSession !== undefined &&
    typeof selectedSession === 'object' &&
    Object.keys(selectedSession).length > 0

  // Fallback check for hydration (runs after Redux store rehydrates)
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Set direct check based on selector values after a short delay for hydration
    const timer = setTimeout(() => {
      setDirectCheck(selectorConnected)
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [selectorConnected])

  // Return true if either selector or direct check indicates connection
  const isConnected = selectorConnected || directCheck

  return { isConnected }
}
