'use client'

import { getThemeClasses } from '@/lib/theme'
import { getTransactions } from '@/lib/walletConnect/utils/transactionStorage'
import { History, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { mojosToXch } from '@/lib/utils/chia-units'
import type { StoredTransaction } from '@/lib/walletConnect/utils/transactionStorage'

export default function RecentTransactions() {
  const { theme: currentTheme, systemTheme } = useTheme()
  const [transactions, setTransactions] = useState<StoredTransaction[]>([])

  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && systemTheme === 'dark')
  const t = getThemeClasses(isDark)

  useEffect(() => {
    // Load transactions from localStorage
    const loadTransactions = () => {
      setTransactions(getTransactions())
    }
    loadTransactions()

    // Listen for storage changes (from other tabs/windows)
    const handleStorageChange = () => {
      loadTransactions()
    }

    // Listen for custom transaction events (from same window)
    const handleTransactionEvent = () => {
      loadTransactions()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('transactionSaved', handleTransactionEvent)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('transactionSaved', handleTransactionEvent)
    }
  }, [])

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const formatAmount = (amount: string): string => {
    try {
      const mojos = BigInt(amount)
      const xch = mojosToXch(Number(mojos))
      return xch.toFixed(6)
    } catch {
      return '0.000000'
    }
  }

  if (transactions.length === 0) {
    return (
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
            No transactions yet. Transactions sent from this wallet will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
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
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className={`p-3 rounded-xl backdrop-blur-xl border transition-all ${
              isDark
                ? 'bg-white/[0.03] border-white/5 hover:bg-white/5'
                : 'bg-white/50 border-cyan-200/30 hover:bg-white/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    tx.type === 'send'
                      ? isDark
                        ? 'bg-red-500/10'
                        : 'bg-red-100'
                      : isDark
                        ? 'bg-emerald-500/10'
                        : 'bg-emerald-100'
                  }`}
                >
                  {tx.type === 'send' ? (
                    <ArrowUpRight
                      className={
                        tx.type === 'send' ? (isDark ? 'text-red-400' : 'text-red-600') : ''
                      }
                      size={16}
                    />
                  ) : (
                    <ArrowDownLeft
                      className={isDark ? 'text-emerald-400' : 'text-emerald-600'}
                      size={16}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`${t.text} text-sm font-medium`}>
                      {tx.type === 'send' ? 'Sent' : 'Received'}
                    </p>
                    {tx.status === 'pending' && (
                      <Clock
                        className={`${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}
                        size={14}
                      />
                    )}
                    {tx.status === 'confirmed' && (
                      <CheckCircle2
                        className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
                        size={14}
                      />
                    )}
                    {tx.status === 'failed' && (
                      <XCircle
                        className={`${isDark ? 'text-red-400' : 'text-red-600'}`}
                        size={14}
                      />
                    )}
                  </div>
                  <p className={`${t.textSecondary} text-xs truncate`}>
                    {tx.recipientAddress || tx.senderAddress
                      ? `${(tx.recipientAddress || tx.senderAddress || '').slice(0, 8)}...${(tx.recipientAddress || tx.senderAddress || '').slice(-6)}`
                      : 'Unknown address'}
                  </p>
                  {tx.memo && (
                    <p className={`${t.textSecondary} text-xs mt-1 truncate`} title={tx.memo}>
                      Memo: {tx.memo}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0 ml-3">
                <p
                  className={`text-sm font-semibold ${
                    tx.type === 'send'
                      ? isDark
                        ? 'text-red-400'
                        : 'text-red-600'
                      : isDark
                        ? 'text-emerald-400'
                        : 'text-emerald-600'
                  }`}
                >
                  {tx.type === 'send' ? '-' : '+'}
                  {formatAmount(tx.amount)} XCH
                </p>
                <p className={`${t.textSecondary} text-xs`}>{formatDate(tx.timestamp)}</p>
                {tx.fee && parseFloat(tx.fee) > 0 && (
                  <p className={`${t.textSecondary} text-[10px] mt-0.5`}>
                    Fee: {formatAmount(tx.fee)} XCH
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
