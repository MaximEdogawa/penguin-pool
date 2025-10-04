import { createAppKit } from '@reown/appkit/react'
import { mainnet } from 'viem/chains'
import { WagmiProvider } from 'wagmi'

// Get projectId from environment variables
const projectId = process.env.EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'your_project_id_here'

// Create wagmi config
const metadata = {
  name: 'Penguin Pool',
  description: 'DeFi Lending Platform',
  url: 'https://penguinpool.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
}

// Create AppKit
const appKit = createAppKit({
  adapters: [WagmiProvider],
  projectId,
  defaultNetwork: mainnet,
  metadata,
})

export { appKit }
export type { WagmiProvider }
