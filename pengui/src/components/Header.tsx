'use client'

import { ConnectButton } from '@chia/wallet-connect'

export default function Header() {
  // Show ConnectButton in top right corner (always visible, shows connection status)
  return (
    <header className="fixed top-0 right-0 z-50 p-4">
      <ConnectButton
        connectText="Connect Wallet"
        walletConnectIcon={
          typeof window !== 'undefined'
            ? `${window.location.origin}/penguin-pool.svg`
            : '/penguin-pool.svg'
        }
        walletConnectMetadata={{
          name: 'Pengui',
          description: 'Penguin Pool - Decentralized lending platform on Chia Network',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://penguin.pool',
          icons: [
            typeof window !== 'undefined'
              ? `${window.location.origin}/penguin-pool.svg`
              : '/penguin-pool.svg',
            typeof window !== 'undefined'
              ? `${window.location.origin}/icons/icon-192x192.png`
              : '/icons/icon-192x192.png',
          ],
        }}
        className="shadow-lg"
      />
    </header>
  )
}
