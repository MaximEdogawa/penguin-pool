// Simple test to verify WalletConnect types are working
import type { CoreTypes, ProposalTypes } from '@walletconnect/types'

// Test that we can create the required types
export const testWalletConnectTypes = () => {
  console.log('✅ WalletConnect types imported successfully')

  // Test CoreTypes.Metadata
  const metadata: CoreTypes.Metadata = {
    name: 'Test App',
    description: 'Test description',
    url: 'https://test.com',
    icons: ['https://test.com/icon.png'],
  }
  console.log('✅ CoreTypes.Metadata works:', metadata)

  // Test ProposalTypes.RequiredNamespaces
  const namespaces: ProposalTypes.RequiredNamespaces = {
    chia: {
      methods: ['chia_logIn', 'chia_getWallets'],
      chains: ['chia:testnet'],
      events: [],
    },
  }
  console.log('✅ ProposalTypes.RequiredNamespaces works:', namespaces)

  return true
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).testWalletConnectTypes = testWalletConnectTypes
}
