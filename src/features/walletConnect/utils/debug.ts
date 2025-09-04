// Debug utilities for WalletConnect troubleshooting
export const debugWalletConnect = {
  logConnectionFlow: (step: string, data?: unknown) => {
    console.log(`🔍 WalletConnect Debug [${step}]:`, data)
  },

  logError: (error: unknown, context?: string) => {
    console.error(`❌ WalletConnect Error${context ? ` [${context}]` : ''}:`, error)
  },

  logSuccess: (message: string, data?: unknown) => {
    console.log(`✅ WalletConnect Success [${message}]:`, data)
  },

  logWarning: (message: string, data?: unknown) => {
    console.warn(`⚠️ WalletConnect Warning [${message}]:`, data)
  },
}

// Export for browser console access
if (typeof window !== 'undefined') {
  ;(window as Record<string, unknown>).debugWalletConnect = debugWalletConnect
}
