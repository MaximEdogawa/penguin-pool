'use client'

import PenguinLogo from '@/components/PenguinLogo'
import { useWalletConnect } from '@/lib/walletConnect/hooks/useWalletConnect'
import { ArrowRight, Loader2, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const { isInitializing, isConnecting, isConnected, address, error, connect, getAddress } =
    useWalletConnect()
  const [selectedNetwork, setSelectedNetwork] = useState('chia:testnet')
  const previousErrorRef = useRef<unknown>(null)

  useEffect(() => {
    if (isConnected && address) {
      router.push('/dashboard')
    }
  }, [isConnected, address, router])

  useEffect(() => {
    if (isConnected && !address) {
      getAddress()
    }
  }, [isConnected, address, getAddress])

  useEffect(() => {
    if (error && error !== previousErrorRef.current) {
      previousErrorRef.current = error
      const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error'
      toast.error(`Connection failed: ${errorMessage}`)
    }
  }, [error])

  const handleConnect = async () => {
    try {
      connect()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err) || 'Unknown error'
      toast.error(`Connection failed: ${errorMessage}`)
    }
  }

  const isConnectingState = isInitializing || isConnecting

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 sm:py-20 md:px-20 lg:px-80 backdrop-blur-3xl bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{
        backgroundImage: "url('/signin-glass.jpg')",
      }}
    >
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/15 to-pink-500/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* Animated background elements */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse pointer-events-none"
        style={{ animationDelay: '0s' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse pointer-events-none"
        style={{ animationDelay: '1s' }}
      />

      <div className="px-6 sm:px-8 md:px-12 lg:px-16 flex py-8 sm:py-10 flex-col items-center gap-6 w-full backdrop-blur-xl rounded-3xl bg-white/5 dark:bg-gray-900/5 border border-white/20 dark:border-gray-700/20 shadow-2xl shadow-black/20 max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo and Title Section */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3 backdrop-blur-sm border border-white/20 shadow-lg">
            <PenguinLogo size={64} className="drop-shadow-lg" />
          </div>
          <div className="flex flex-col gap-2 w-full">
            <h1 className="text-center text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
              Penguin Pool
            </h1>
            <p className="text-center text-sm sm:text-base text-white/90 dark:text-gray-200 font-light leading-relaxed px-2">
              Connect your wallet to access the decentralized lending platform
            </p>
          </div>
        </div>

        {/* Wallet Connection Section */}
        <div className="flex flex-col items-center w-full gap-4">
          <div className="flex flex-col w-full">
            <button
              onClick={handleConnect}
              disabled={isConnectingState}
              className="relative overflow-hidden rounded-3xl w-full transition-all duration-500 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 group"
            >
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                <div className="h-full w-full rounded-3xl bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95" />
              </div>

              {/* Main content container */}
              <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent dark:from-gray-800/20 dark:via-gray-800/10 dark:to-transparent backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/30 p-4 sm:p-5">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-pink-500/20 transition-all duration-700 rounded-3xl pointer-events-none" />

                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-3xl pointer-events-none" />

                <div className="relative z-10 flex items-center gap-4">
                  {/* Icon container with modern design */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-xl shadow-blue-500/30 group-hover:shadow-blue-500/50 group-hover:scale-110 transition-all duration-500 border-2 border-white/30">
                      {isConnectingState ? (
                        <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 text-white animate-spin drop-shadow-lg" />
                      ) : (
                        <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-lg" />
                      )}
                    </div>
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-base sm:text-lg font-bold text-white drop-shadow-lg [text-shadow:0_2px_8px_rgba(0,0,0,0.6)] leading-tight whitespace-nowrap mb-0.5">
                      Sage Wallet
                    </h3>
                    <p className="text-xs sm:text-sm text-white/90 font-medium drop-shadow-md [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] leading-tight">
                      Connect to Chia Network
                    </p>
                  </div>

                  {/* Arrow icon */}
                  <div className="flex-shrink-0">
                    {!isConnectingState && (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 group-hover:border-white/30 group-hover:translate-x-1 transition-all duration-300">
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-lg" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Glow effect on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10" />
            </button>
          </div>
        </div>

        {/* Network Selector */}
        <div className="w-full">
          <div className="flex flex-row items-center justify-center gap-2 p-3 rounded-xl bg-white/5 dark:bg-gray-800/5 backdrop-blur-sm border border-white/10 dark:border-gray-700/20">
            <label
              htmlFor="network-select"
              className="text-xs sm:text-sm font-medium text-white/70 dark:text-gray-400"
            >
              Network:
            </label>
            <select
              id="network-select"
              value={selectedNetwork}
              onChange={(e) => {
                const newNetwork = e.target.value
                setSelectedNetwork(newNetwork)
                const networkName = newNetwork === 'chia:mainnet' ? 'Mainnet' : 'Testnet'
                toast.success(`Switched to ${networkName}`)
              }}
              className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 text-white dark:text-gray-300 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-200 cursor-pointer"
            >
              <option value="chia:testnet" className="bg-gray-900 text-white">
                Testnet
              </option>
              <option value="chia:mainnet" className="bg-gray-900 text-white">
                Mainnet
              </option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-white/60 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
            By connecting your wallet, you agree to our{' '}
            <a
              href="#"
              className="text-white/90 dark:text-gray-300 hover:text-white dark:hover:text-gray-100 underline underline-offset-2 hover:underline-offset-4 transition-all font-medium"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="#"
              className="text-white/90 dark:text-gray-300 hover:text-white dark:hover:text-gray-100 underline underline-offset-2 hover:underline-offset-4 transition-all font-medium"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
