'use client'

import { getThemeClasses } from '@/lib/theme'
import { logger } from '@/lib/logger'
import {
  getMinimumFeeInXch,
  isValidChiaAddress,
  mojosToXch,
  xchToMojos,
} from '@/lib/utils/chia-units'
import { ConnectButton, useWalletConnectionState } from '@maximedogawa/chia-wallet-connect-react'
import { useWalletBalance, useRefreshBalance, useSendTransaction } from '@/hooks'
import { Wallet, Copy, Send, History, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState, useMemo } from 'react'

export default function WalletPage() {
  const [mounted, setMounted] = useState(false)
  const [isAddressCopied, setIsAddressCopied] = useState(false)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [fee, setFee] = useState('0.000001')
  const [memo, setMemo] = useState('')
  const [addressError, setAddressError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [feeError, setFeeError] = useState('')
  const [transactionStatus, setTransactionStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showInitialLoading, setShowInitialLoading] = useState(false)

  const { theme: currentTheme, systemTheme } = useTheme()
  const { isConnected, address, connectedWallet, walletName } = useWalletConnectionState()
  const { data: balance, isLoading: isLoadingBalance, error: balanceError } = useWalletBalance()
  const { refreshBalance } = useRefreshBalance()
  const sendTransactionMutation = useSendTransaction()

  // Show initial loading spinner with a small delay
  useEffect(() => {
    if (isConnected && isLoadingBalance) {
      const timer = setTimeout(() => {
        setShowInitialLoading(true)
      }, 300) // Small delay before showing spinner
      return () => clearTimeout(timer)
    } else {
      setShowInitialLoading(false)
    }
  }, [isConnected, isLoadingBalance])

  // Determine if we should show the spinner
  const showSpinner =
    isLoadingBalance || isRefreshing || (showInitialLoading && isConnected && !balance)

  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && systemTheme === 'dark')
  const t = getThemeClasses(isDark)

  // Format balance from mojos to XCH (1 XCH = 1,000,000,000,000 mojos)
  const formattedBalance = useMemo(() => {
    if (!balance?.confirmed) return '0.000000'
    const mojos = BigInt(balance.confirmed)
    const xch = Number(mojos) / 1_000_000_000_000
    return xch.toFixed(6)
  }, [balance])

  const formattedSpendable = useMemo(() => {
    if (!balance?.spendable) return '0.000000'
    const mojos = BigInt(balance.spendable)
    const xch = Number(mojos) / 1_000_000_000_000
    return xch.toFixed(6)
  }, [balance])

  const availableBalance = useMemo(() => {
    if (!balance?.spendable) return 0
    return mojosToXch(balance.spendable)
  }, [balance])

  // Validation functions
  const validateAddress = () => {
    const trimmed = recipientAddress.trim()
    if (!trimmed) {
      setAddressError('')
      return false
    }
    if (!isValidChiaAddress(trimmed)) {
      setAddressError('Invalid Chia address format')
      return false
    }
    setAddressError('')
    return true
  }

  const validateAmount = () => {
    const amountNum = parseFloat(amount)
    const feeNum = parseFloat(fee || '0')
    const total = amountNum + feeNum

    if (!amount || amountNum <= 0) {
      setAmountError('Amount must be greater than 0')
      return false
    }

    if (total > availableBalance) {
      setAmountError(
        `Insufficient balance. Total (${total.toFixed(6)}) exceeds available (${availableBalance.toFixed(6)} XCH)`
      )
      return false
    }

    setAmountError('')
    return true
  }

  const validateFee = () => {
    const feeNum = parseFloat(fee || '0')
    const minFee = getMinimumFeeInXch()

    if (!fee || feeNum <= 0) {
      setFeeError('Fee must be greater than 0')
      return false
    }

    if (feeNum < minFee) {
      setFeeError(`Minimum fee is ${minFee} XCH`)
      return false
    }

    setFeeError('')
    return true
  }

  const isFormValid = useMemo(() => {
    return (
      recipientAddress.trim() &&
      amount &&
      fee &&
      !addressError &&
      !amountError &&
      !feeError &&
      parseFloat(amount) > 0 &&
      parseFloat(fee) > 0
    )
  }, [recipientAddress, amount, fee, addressError, amountError, feeError])

  const handleSendTransaction = async () => {
    setTransactionStatus({ type: null, message: '' })

    if (!validateAddress() || !validateAmount() || !validateFee()) {
      return
    }

    if (!isConnected) {
      setTransactionStatus({ type: 'error', message: 'Wallet not connected' })
      return
    }

    try {
      const result = await sendTransactionMutation.mutateAsync({
        walletId: 1, // Default wallet ID
        address: recipientAddress.trim(),
        amount: xchToMojos(parseFloat(amount)),
        fee: xchToMojos(parseFloat(fee)),
        memos: memo.trim() ? [memo.trim()] : undefined,
      })

      // Extract transaction ID from various possible response structures
      let transactionId = 'N/A'
      if (result && typeof result === 'object') {
        const resultObj = result as unknown as Record<string, unknown>

        // Try different possible field names
        if (typeof resultObj.transactionId === 'string') {
          transactionId = resultObj.transactionId
        } else if (typeof resultObj.id === 'string') {
          transactionId = resultObj.id
        } else if (typeof resultObj.transaction_id === 'string') {
          transactionId = resultObj.transaction_id
        } else if (typeof resultObj.txId === 'string') {
          transactionId = resultObj.txId
        } else if (resultObj.transaction && typeof resultObj.transaction === 'object') {
          const transaction = resultObj.transaction as Record<string, unknown>
          if (typeof transaction.transactionId === 'string') {
            transactionId = transaction.transactionId
          } else if (typeof transaction.id === 'string') {
            transactionId = transaction.id
          }
        } else if (typeof resultObj.transaction === 'string') {
          transactionId = resultObj.transaction
        }
      }

      logger.info('Transaction result:', result)

      setTransactionStatus({
        type: 'success',
        message: `Transaction sent successfully!${transactionId !== 'N/A' ? ` Transaction ID: ${transactionId}` : ''}`,
      })

      // Reset form
      setRecipientAddress('')
      setAmount('')
      setFee('0.000001')
      setMemo('')
      setAddressError('')
      setAmountError('')
      setFeeError('')

      // Refresh balance
      setTimeout(() => {
        refreshBalance()
      }, 2000)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      setTransactionStatus({ type: 'error', message: `Transaction failed: ${errorMsg}` })
      logger.error('Transaction failed:', error)
    }
  }

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
              {isConnected ? (
                balanceError ? (
                  <span className={`${isDark ? 'text-red-400' : 'text-red-600'} text-lg`}>
                    Error loading balance
                  </span>
                ) : (
                  <span className={`tabular-nums ${showSpinner ? 'opacity-40' : ''}`}>
                    {formattedBalance} XCH
                  </span>
                )
              ) : (
                '-- XCH'
              )}
            </h2>
            <div className="mt-1">
              {isConnected ? (
                <>
                  <p className={`${t.textSecondary} text-xs`}>
                    {walletName || connectedWallet || 'Wallet Connected'}
                  </p>
                  {balance && !isLoadingBalance && (
                    <p className={`${t.textSecondary} text-xs mt-1`}>
                      Spendable: {formattedSpendable} XCH
                      {balance.spendableCoinCount !== undefined && (
                        <span className="ml-2">
                          ({balance.spendableCoinCount} coin
                          {balance.spendableCoinCount !== 1 ? 's' : ''})
                        </span>
                      )}
                    </p>
                  )}
                </>
              ) : (
                <p className={`${t.textSecondary} text-xs`}>
                  <span className={`${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                    Not connected
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <button
                onClick={async () => {
                  setIsRefreshing(true)
                  try {
                    await refreshBalance()
                    // Small delay to show the spinner
                    await new Promise((resolve) => setTimeout(resolve, 500))
                  } catch (error) {
                    logger.warn('Failed to refresh balance:', error)
                  } finally {
                    setIsRefreshing(false)
                  }
                }}
                disabled={showSpinner}
                className={`p-2 rounded-lg ${t.cardHover} transition-colors ${t.textSecondary} ${t.textHover} disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Refresh balance"
              >
                <RefreshCw
                  size={18}
                  strokeWidth={2}
                  className={showSpinner ? 'animate-spin' : ''}
                />
              </button>
            )}
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
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-6">
            <p className={`${t.textSecondary} text-sm mb-4 text-center`}>
              Connect your wallet to send transactions
            </p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className={`${t.textSecondary} text-xs font-medium mb-2 block`}>
                Recipient Address
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => {
                  setRecipientAddress(e.target.value)
                  if (addressError) validateAddress()
                }}
                onBlur={validateAddress}
                placeholder="xch1..."
                className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl ${t.input} ${t.text} placeholder:${t.textSecondary} focus:outline-none focus:ring-2 ${
                  addressError ? 'ring-2 ring-red-500/50' : t.focusRing
                } transition-all`}
              />
              {addressError && (
                <p className={`${isDark ? 'text-red-400' : 'text-red-600'} text-xs mt-1`}>
                  {addressError}
                </p>
              )}
            </div>
            <div>
              <label className={`${t.textSecondary} text-xs font-medium mb-2 block`}>
                Amount (XCH)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  if (amountError) validateAmount()
                }}
                onBlur={validateAmount}
                placeholder="0.000000"
                step="0.000001"
                min="0"
                className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl ${t.input} ${t.text} placeholder:${t.textSecondary} focus:outline-none focus:ring-2 ${
                  amountError ? 'ring-2 ring-red-500/50' : t.focusRing
                } transition-all`}
              />
              {amountError && (
                <p className={`${isDark ? 'text-red-400' : 'text-red-600'} text-xs mt-1`}>
                  {amountError}
                </p>
              )}
              {availableBalance > 0 && (
                <p className={`${t.textSecondary} text-xs mt-1`}>
                  Available: {availableBalance.toFixed(6)} XCH
                </p>
              )}
            </div>
            <div>
              <label className={`${t.textSecondary} text-xs font-medium mb-2 block`}>
                Fee (XCH) <span className="text-[10px]">(min: {getMinimumFeeInXch()})</span>
              </label>
              <input
                type="number"
                value={fee}
                onChange={(e) => {
                  setFee(e.target.value)
                  if (feeError) validateFee()
                }}
                onBlur={validateFee}
                placeholder="0.000001"
                step="0.000001"
                min={getMinimumFeeInXch()}
                className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl ${t.input} ${t.text} placeholder:${t.textSecondary} focus:outline-none focus:ring-2 ${
                  feeError ? 'ring-2 ring-red-500/50' : t.focusRing
                } transition-all`}
              />
              {feeError && (
                <p className={`${isDark ? 'text-red-400' : 'text-red-600'} text-xs mt-1`}>
                  {feeError}
                </p>
              )}
            </div>
            <div>
              <label className={`${t.textSecondary} text-xs font-medium mb-2 block`}>
                Memo (Optional)
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Optional memo"
                className={`w-full px-4 py-3 rounded-xl backdrop-blur-xl ${t.input} ${t.text} placeholder:${t.textSecondary} focus:outline-none focus:ring-2 ${t.focusRing} transition-all`}
              />
            </div>
            {transactionStatus.type && (
              <div
                className={`p-3 rounded-xl flex items-start gap-2 ${
                  transactionStatus.type === 'success'
                    ? isDark
                      ? 'bg-emerald-500/10 border border-emerald-400/30'
                      : 'bg-emerald-50 border border-emerald-200'
                    : isDark
                      ? 'bg-red-500/10 border border-red-400/30'
                      : 'bg-red-50 border border-red-200'
                }`}
              >
                {transactionStatus.type === 'success' ? (
                  <CheckCircle2
                    className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'} flex-shrink-0 mt-0.5`}
                    size={16}
                  />
                ) : (
                  <AlertCircle
                    className={`${isDark ? 'text-red-400' : 'text-red-600'} flex-shrink-0 mt-0.5`}
                    size={16}
                  />
                )}
                <p
                  className={`text-xs ${
                    transactionStatus.type === 'success'
                      ? isDark
                        ? 'text-emerald-400'
                        : 'text-emerald-700'
                      : isDark
                        ? 'text-red-400'
                        : 'text-red-700'
                  }`}
                >
                  {transactionStatus.message}
                </p>
              </div>
            )}
            <button
              onClick={handleSendTransaction}
              disabled={!isFormValid || sendTransactionMutation.isPending}
              className={`w-full px-6 py-3 rounded-xl backdrop-blur-xl ${
                isFormValid && !sendTransactionMutation.isPending
                  ? isDark
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30'
                    : 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-600/40 text-cyan-700 hover:from-cyan-600/40 hover:to-blue-600/40'
                  : 'opacity-50 cursor-not-allowed'
              } transition-all duration-200 font-medium flex items-center justify-center gap-2`}
            >
              {sendTransactionMutation.isPending ? (
                <>
                  <RefreshCw size={18} strokeWidth={2.5} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} strokeWidth={2.5} />
                  Send Transaction
                </>
              )}
            </button>
          </div>
        )}
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
