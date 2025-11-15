'use client'

import { getThemeClasses } from '@/lib/theme'
import { Wallet } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function WalletPageHeader() {
  const { theme: currentTheme, systemTheme } = useTheme()
  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && systemTheme === 'dark')
  const t = getThemeClasses(isDark)

  return (
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
  )
}
