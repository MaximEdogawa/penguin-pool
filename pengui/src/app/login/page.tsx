'use client'

import PenguinLogo from '@/components/PenguinLogo'
import { useWallet } from '@/features/walletConnect'
import { ArrowRight, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const { isConnecting, isConnected, address, connectWallet } = useWallet()
  const isInitializing = false // WalletContext handles initialization internally
  const [selectedNetwork, setSelectedNetwork] = useState('chia:testnet')
  const previousErrorRef = useRef<unknown>(null)

  useEffect(() => {
    if (isConnected && address) {
      router.push('/dashboard')
    }
  }, [isConnected, address, router])

  // Address is automatically fetched when connected via WalletContext

  const handleConnect = async () => {
    // Reset previous error when starting a new connection attempt
    previousErrorRef.current = null
    try {
      await connectWallet('chiawalletconnect', false)
    } catch (err) {
      // Only show toast once per error
      if (err !== previousErrorRef.current) {
        previousErrorRef.current = err
        const errorMessage = err instanceof Error ? err.message : String(err) || 'Unknown error'
        toast.error(`Connection failed: ${errorMessage}`)
      }
    }
  }

  const isConnectingState = isInitializing || isConnecting

  return (
    <div
      className="min-h-screen flex items-center justify-center px-3 py-8 sm:px-4 sm:py-12 md:px-6 md:py-16 lg:px-20 xl:px-80 backdrop-blur-3xl bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{
        backgroundImage: "url('/signin-glass.jpg')",
      }}
    >
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/15 to-pink-500/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      {/* Background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="px-4 sm:px-6 md:px-8 lg:px-10 flex py-6 sm:py-8 md:py-10 flex-col items-center gap-4 sm:gap-5 w-full backdrop-blur-2xl rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/10 via-white/5 to-transparent dark:from-gray-900/10 dark:via-gray-900/5 dark:to-transparent border border-white/20 dark:border-gray-700/20 shadow-2xl shadow-black/20 max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo and Title Section */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
          <div className="relative group">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-br from-blue-500/25 via-purple-500/25 to-pink-500/25 backdrop-blur-lg border-2 border-white/40 shadow-xl sm:shadow-2xl shadow-purple-500/20 group-hover:border-white/60 group-hover:shadow-purple-500/30 transition-all duration-300 overflow-hidden p-2.5 sm:p-3 md:p-2.5">
              <PenguinLogo fill priority className="drop-shadow-xl sm:drop-shadow-2xl" />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:gap-2.5 w-full">
            <h1 className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-none tracking-tight">
              <span className="bg-[linear-gradient(to_right,white,rgb(191_219_254),rgb(221_214_254),rgb(251_207_232))] bg-clip-text text-transparent">
                Pengui
              </span>
            </h1>
            {/* Decorative accent line */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
              <div className="h-px w-8 sm:w-10 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
              <div className="h-0.5 w-0.5 sm:h-1 sm:w-1 rounded-full bg-purple-400/50" />
              <div className="h-px w-12 sm:w-14 bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
              <div className="h-0.5 w-0.5 sm:h-1 sm:w-1 rounded-full bg-pink-400/50" />
              <div className="h-px w-8 sm:w-10 bg-gradient-to-r from-transparent via-pink-400/40 to-transparent" />
            </div>
          </div>
        </div>

        {/* Wallet Connection Section */}
        <div className="flex flex-col items-center w-full gap-3 sm:gap-4">
          <div className="flex flex-col w-full">
            <button
              onClick={handleConnect}
              disabled={isConnectingState}
              className="relative overflow-hidden rounded-2xl sm:rounded-3xl w-full transition-all duration-500 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 group"
            >
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                <div className="h-full w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95" />
              </div>

              {/* Main content container */}
              <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent dark:from-gray-800/20 dark:via-gray-800/10 dark:to-transparent backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/20 dark:border-gray-700/30 p-2.5 sm:p-3 md:p-3.5">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-pink-500/20 transition-all duration-700 rounded-2xl sm:rounded-3xl pointer-events-none" />

                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl sm:rounded-3xl pointer-events-none" />

                <div className="relative z-10 flex items-center gap-2.5 sm:gap-3">
                  {/* Icon container - High resolution Sage icon */}
                  <div className="relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden backdrop-blur-sm bg-white/5 border-2 border-white/30 shadow-md sm:shadow-lg shadow-white/10 group-hover:border-white/50 group-hover:shadow-xl group-hover:shadow-white/20 transition-all duration-300">
                    {isConnectingState ? (
                      <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white animate-spin drop-shadow-lg" />
                    ) : (
                      <Image
                        src="/icons/Sage-icon.png"
                        alt="Sage Wallet"
                        width={310}
                        height={310}
                        className="w-full h-full object-cover"
                        priority
                        quality={100}
                      />
                    )}
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white drop-shadow-lg [text-shadow:0_2px_8px_rgba(0,0,0,0.6)] leading-tight whitespace-nowrap mb-0.5 tracking-tight">
                      Sage Wallet
                    </h3>
                    <p className="text-[10px] sm:text-xs text-white/85 font-normal drop-shadow-md [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] leading-tight tracking-wide">
                      Connect to Chia Network
                    </p>
                  </div>

                  {/* Arrow icon */}
                  <div className="flex-shrink-0">
                    {!isConnectingState && (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 group-hover:border-white/30 group-hover:translate-x-1 transition-all duration-300">
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white drop-shadow-lg" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Glow effect on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10" />
            </button>
          </div>
        </div>

        {/* Network Selector */}
        <div className="w-full">
          <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/5 dark:bg-gray-800/5 backdrop-blur-sm border border-white/10 dark:border-gray-700/20">
            <label
              htmlFor="network-select"
              className="text-[10px] sm:text-xs font-normal text-white/70 dark:text-gray-400 tracking-wide"
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
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs rounded-md sm:rounded-lg bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 text-white dark:text-gray-300 font-normal focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-200 cursor-pointer tracking-wide"
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
        <div className="text-center pt-1">
          <p className="text-white/55 dark:text-gray-400 text-[9px] sm:text-[10px] md:text-[11px] leading-relaxed tracking-wide">
            By connecting your wallet, you agree to our{' '}
            <a
              href="#"
              className="text-white/80 dark:text-gray-300 hover:text-white dark:hover:text-gray-100 underline underline-offset-2 hover:underline-offset-4 transition-all font-normal"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="#"
              className="text-white/80 dark:text-gray-300 hover:text-white dark:hover:text-gray-100 underline underline-offset-2 hover:underline-offset-4 transition-all font-normal"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
