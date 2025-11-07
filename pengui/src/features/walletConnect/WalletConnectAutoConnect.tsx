'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Suspense, useEffect, useState } from 'react'
import { useWallet } from './WalletContext'

export default function SuspensefulComponent() {
  return (
    <Suspense>
      <WalletConnectAutoConnect />
    </Suspense>
  )
}

function WalletConnectAutoConnect() {
  const [isXchLoading, setIsXchLoading] = useState(false)
  const { address: xchAddress, connectWallet, walletConnectUri } = useWallet()

  // Chia wallet
  useEffect(() => {
    const promise = async () => {
      setIsXchLoading(true)
      await connectWallet('chiawalletconnect', false)
    }

    if (!walletConnectUri && !isXchLoading && !xchAddress) {
      promise()
    }

    ;(window as any).xch_wc_uri = xchAddress
      ? 'connected'
      : !walletConnectUri
        ? 'loading'
        : walletConnectUri
  }, [connectWallet, walletConnectUri, isXchLoading, setIsXchLoading, xchAddress])

  return (
    <div className="max-w-md flex flex-col justify-center mx-auto w-full break-words grow">
      <p className="text-center text-theme-green-foreground text-2xl font-light mb-4">
        Connecting wallet...
      </p>
      <p className="text-center text-theme-purple mb-8">
        Taking more than a few seconds? Go to the{' '}
        <a href="/bridge" className="underline hover:opacity-75">
          bridge interface
        </a>
        .
      </p>
    </div>
  )
}
