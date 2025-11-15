'use client'

import { useWalletBalance } from '@/hooks'
import { mojosToXch } from '@/lib/utils/chia-units'
import { useMemo, useEffect, useState } from 'react'
import WalletPageHeader from '@/components/wallet/WalletPageHeader'
import WalletBalanceCard from '@/components/wallet/WalletBalanceCard'
import WalletAddress from '@/components/wallet/WalletAddress'
import SendTransactionForm from '@/components/wallet/SendTransactionForm'
import RecentTransactions from '@/components/wallet/RecentTransactions'
import { getThemeClasses } from '@/lib/theme'
import { Send } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function WalletPage() {
  const [mounted, setMounted] = useState(false)
  const { theme: currentTheme, systemTheme } = useTheme()
  const { data: balance } = useWalletBalance()

  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && systemTheme === 'dark')
  const t = getThemeClasses(isDark)

  const availableBalance = useMemo(() => {
    if (!balance?.spendable) return 0
    return mojosToXch(balance.spendable)
  }, [balance])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="w-full relative z-10">
      <WalletPageHeader />

      <div
        className={`mb-2 backdrop-blur-[40px] ${t.card} rounded-2xl p-3 border ${t.border} transition-all duration-300 shadow-lg shadow-black/5 ${
          isDark ? 'bg-white/[0.03]' : 'bg-white/30'
        }`}
      >
        <WalletBalanceCard />
        <div className="mt-3">
          <WalletAddress />
        </div>
      </div>

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
        <SendTransactionForm availableBalance={availableBalance} />
      </div>

      <RecentTransactions />
    </div>
  )
}
