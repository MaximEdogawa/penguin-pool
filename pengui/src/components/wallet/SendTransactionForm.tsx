'use client'

import { getThemeClasses } from '@/lib/theme'
import { getMinimumFeeInXch } from '@/lib/utils/chia-units'
import { ConnectButton, useWalletConnectionState } from '@maximedogawa/chia-wallet-connect-react'
import { useSendTransaction, useRefreshBalance } from '@/hooks'
import { useTransactionForm } from '@/hooks/useTransactionForm'
import { Send, RefreshCw } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import TransactionStatus from './TransactionStatus'
import { logger } from '@/lib/logger'
import { saveTransaction } from '@/lib/walletConnect/utils/transactionStorage'

interface SendTransactionFormProps {
  availableBalance: number
}

export default function SendTransactionForm({ availableBalance }: SendTransactionFormProps) {
  const { theme: currentTheme, systemTheme } = useTheme()
  const { isConnected, address } = useWalletConnectionState()
  const sendTransactionMutation = useSendTransaction()
  const { refreshBalance } = useRefreshBalance()

  const {
    recipientAddress,
    setRecipientAddress,
    amount,
    setAmount,
    fee,
    setFee,
    memo,
    setMemo,
    addressError,
    amountError,
    feeError,
    validateAddress,
    validateAmount,
    validateFee,
    isFormValid,
    resetForm,
    getTransactionParams,
  } = useTransactionForm({ availableBalance })

  const [transactionStatus, setTransactionStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && systemTheme === 'dark')
  const t = getThemeClasses(isDark)

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
      const result = await sendTransactionMutation.mutateAsync(getTransactionParams())

      // Extract transaction ID from various possible response structures
      let transactionId = 'N/A'
      if (result && typeof result === 'object') {
        const resultObj = result as unknown as Record<string, unknown>

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

      // Save transaction to local storage
      const params = getTransactionParams()
      saveTransaction({
        transactionId: transactionId,
        type: 'send',
        amount: params.amount.toString(),
        fee: params.fee.toString(),
        recipientAddress: params.address,
        senderAddress: address || undefined,
        memo: params.memos?.[0],
        status: 'pending', // Will be updated when confirmed
      })

      setTransactionStatus({
        type: 'success',
        message: `Transaction sent successfully!${transactionId !== 'N/A' ? ` Transaction ID: ${transactionId}` : ''}`,
      })

      resetForm()

      // Trigger custom event to update RecentTransactions component
      window.dispatchEvent(new Event('transactionSaved'))

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

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <p className={`${t.textSecondary} text-sm mb-4 text-center`}>
          Connect your wallet to send transactions
        </p>
        <ConnectButton />
      </div>
    )
  }

  return (
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
        <label className={`${t.textSecondary} text-xs font-medium mb-2 block`}>Amount (XCH)</label>
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
          <p className={`${isDark ? 'text-red-400' : 'text-red-600'} text-xs mt-1`}>{feeError}</p>
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
      <TransactionStatus type={transactionStatus.type} message={transactionStatus.message} />
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
  )
}
