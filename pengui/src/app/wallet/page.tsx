'use client'

import { getThemeClasses } from '@/lib/theme'
import { ConnectButton, useWalletConnectionState } from '@maximedogawa/chia-wallet-connect-react'
import { Wallet, Copy, Send, History } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function WalletPage() {
  const [mounted, setMounted] = useState(false)
  const [isAddressCopied, setIsAddressCopied] = useState(false)
  const { theme: currentTheme, systemTheme } = useTheme()
  const { isConnected, address, connectedWallet, walletName } = useWalletConnectionState()

  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && systemTheme === 'dark')
  const t = getThemeClasses(isDark)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatAddress = (address: string): string => {
    if (!address) return ''
    if (address.length <= 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyAddress = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setIsAddressCopied(true)
      setTimeout(() => setIsAddressCopied(false), 2000)
    } catch {
      // Failed to copy
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="w-full relative z-10">
      {/* Header */}
      <div
        className={`mb-2 backdrop-blur-[40px] ${t.card} rounded-2xl p-3 border ${t.border} transition-all duration-300 shadow-lg shadow-black/5 ${
          isDark ? 'bg-white/[0.03]' : 'bg-white/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-600/15'} backdrop-blur-sm`}
          >
            <Wallet
              className={`${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}
              size={18}
              strokeWidth={2}
            />
          </div>
          <div>
            <h1 className={`text-xl lg:text-2xl font-semibold ${t.text} mb-0.5`}>Wallet</h1>
            <p className={`${t.textSecondary} text-xs font-medium`}>
              Manage your wallet balance and transactions
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <div
        className={`mb-2 backdrop-blur-[40px] ${t.card} rounded-2xl p-3 border ${t.border} transition-all duration-300 shadow-lg shadow-black/5 ${
          isDark ? 'bg-white/[0.03]' : 'bg-white/30'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p
              className={`${t.textSecondary} text-[10px] font-medium mb-2 uppercase tracking-wide`}
            >
              Wallet Balance
            </p>
            <h2 className={`text-2xl lg:text-3xl font-semibold ${t.text} tracking-tight`}>
              {isConnected ? '0.000000 XCH' : '-- XCH'}
            </h2>
            <div className="mt-1">
              {isConnected ? (
                <p className={`${t.textSecondary} text-xs`}>
                  {walletName || connectedWallet || 'Wallet Connected'}
                </p>
              ) : (
                <p className={`${t.textSecondary} text-xs`}>
                  <span className={`${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                    Not connected
                  </span>
                </p>
              )}
            </div>
          </div>
          <div
            className={`p-3 rounded-xl ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-600/15'} backdrop-blur-sm`}
          >
            <Wallet
              className={`${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}
              size={20}
              strokeWidth={2}
            />
          </div>
        </div>

        {/* Address Section */}
        {isConnected && address ? (
          <div
            className={`backdrop-blur-xl ${
              isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white/50 border-cyan-200/30'
            } rounded-xl p-3 border transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`p-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white/30'} backdrop-blur-sm`}
                >
                  <Wallet className={`${t.textSecondary}`} size={16} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`${t.textSecondary} text-xs font-medium mb-1`}>Wallet Address</p>
                  <p className={`${t.text} text-sm font-mono truncate`} title={address}>
                    {formatAddress(address)}
                  </p>
                </div>
              </div>
              <button
                onClick={copyAddress}
                className={`p-2 rounded-lg ${t.cardHover} transition-colors ${t.textSecondary} ${t.textHover} flex-shrink-0`}
                title="Copy address"
              >
                <Copy size={18} strokeWidth={2} />
              </button>
            </div>
            {isAddressCopied && (
              <p className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'} text-xs mt-2`}>
                Address copied!
              </p>
            )}
          </div>
        ) : (
          <div
            className={`backdrop-blur-xl ${
              isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white/50 border-cyan-200/30'
            } rounded-xl p-3 border transition-all duration-200 flex flex-col items-center justify-center py-6`}
          >
            <p className={`${t.textSecondary} text-sm mb-4 text-center`}>
              Connect your wallet to view your address
            </p>
            <ConnectButton />
          </div>
        )}
      </div>

      {/* Send Transaction Section */}
      <div
        className={`mb-2 backdrop-blur-[40px] ${t.card} rounded-2xl p-3 border ${t.border} transition-all duration-300 shadow-lg shadow-black/5 ${
          isDark ? 'bg-white/[0.03]' : 'bg-white/30'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`p-1.5 rounded-lg ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-600/15'} backdrop-blur-sm`}
          >
            <Send className={`${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} size={16} />
          </div>
          <h3 className={`${t.text} text-sm font-semibold`}>Send Transaction</h3>
        </div>
        <div className="space-y-2">
          <div>
            <label className={`${t.textSecondary} text-xs font-medium mb-2 block`}>
              Recipient Address
            </label>
            <input
              type="text"
              placeholder="xch1..."
              className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl ${t.input} ${t.text} placeholder:${t.textSecondary} focus:outline-none focus:ring-2 ${t.focusRing} transition-all`}
            />
          </div>
          <div>
            <label className={`${t.textSecondary} text-xs font-medium mb-2 block`}>
              Amount (XCH)
            </label>
            <input
              type="number"
              placeholder="0.000000"
              step="0.000001"
              className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl ${t.input} ${t.text} placeholder:${t.textSecondary} focus:outline-none focus:ring-2 ${t.focusRing} transition-all`}
            />
          </div>
          <button
            className={`w-full px-6 py-3 rounded-xl backdrop-blur-xl ${
              isDark
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30'
                : 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-600/40 text-cyan-700 hover:from-cyan-600/40 hover:to-blue-600/40'
            } transition-all duration-200 font-medium flex items-center justify-center gap-2`}
          >
            <Send size={18} strokeWidth={2.5} />
            Send Transaction
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div
        className={`backdrop-blur-[40px] ${t.card} rounded-2xl p-3 border ${t.border} transition-all duration-300 shadow-lg shadow-black/5 ${
          isDark ? 'bg-white/[0.03]' : 'bg-white/30'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`p-1.5 rounded-lg ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-600/15'} backdrop-blur-sm`}
          >
            <History className={`${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} size={16} />
          </div>
          <h3 className={`${t.text} text-sm font-semibold`}>Recent Transactions</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-4">
          <div
            className={`p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-white/30'} backdrop-blur-xl mb-3`}
          >
            <History
              className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}
              size={32}
              strokeWidth={1.5}
            />
          </div>
          <p className={`${t.textSecondary} text-center text-sm max-w-md`}>
            Transaction history will be displayed here
          </p>
        </div>
      </div>
    </div>
  )
}
