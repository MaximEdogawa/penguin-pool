'use client'

import { useWalletConnect } from '@/lib/walletConnect/hooks/useWalletConnect'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { address, disconnect, isConnected } = useWalletConnect()

  const handleDisconnect = () => {
    disconnect()
    router.push('/login')
  }

  if (!isConnected) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-3xl font-bold text-center">Dashboard</h1>
        <div className="p-6 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground mb-2">Connected Address:</p>
          <p className="font-mono text-sm break-all">{address || 'Loading...'}</p>
        </div>
        <Button onClick={handleDisconnect} variant="outline" className="w-full">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </Button>
      </div>
    </div>
  )
}
