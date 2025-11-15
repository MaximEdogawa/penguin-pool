// Phase 1: Stub implementation - wallet connection will be added in Phase 2
import { useState } from 'react'

export function useWalletConnection() {
  // Demo mode - always return false for Phase 1
  const [isConnected] = useState(false)

  return { isConnected }
}
