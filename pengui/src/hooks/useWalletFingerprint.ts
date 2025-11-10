import { useSelector } from 'react-redux'

/**
 * Hook to get the wallet fingerprint from @chia/wallet-connect Redux store
 */
export function useWalletFingerprint(): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fingerprint = useSelector((state: any): string | null => {
    if (!state?.walletConnect) return null

    const walletState = state.walletConnect

    // Try to get from selectedFingerprint
    if (
      walletState.selectedFingerprint &&
      typeof walletState.selectedFingerprint === 'object' &&
      Object.keys(walletState.selectedFingerprint).length > 0
    ) {
      const value =
        walletState.selectedFingerprint.fingerprint ||
        walletState.selectedFingerprint.value ||
        Object.values(walletState.selectedFingerprint)[0]

      if (value && (typeof value === 'string' || typeof value === 'number')) {
        return String(value)
      }
    }

    // Fallback: get from selectedSession accounts
    const account = walletState.selectedSession?.namespaces?.chia?.accounts?.[0]
    if (account) {
      const parts = account.split(':')
      if (parts.length >= 3) return parts[2]
    }

    return null
  })

  return fingerprint
}
