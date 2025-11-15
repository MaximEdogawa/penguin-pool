'use client'

import { useWalletBalance } from '@/hooks'
import { mojosToXch } from '@/lib/utils/chia-units'
import { useMemo, useEffect, useState } from 'react'
import WalletPageHeader from '@/components/wallet/WalletPageHeader'
import WalletBalanceCard from '@/components/wallet/WalletBalanceCard'
import WalletAddress from '@/components/wallet/WalletAddress'
import SendTransactionForm from '@/components/wallet/SendTransactionForm'
import RecentTransactions from '@/components/wallet/RecentTransactions'
import Card from '@/components/wallet/shared/Card'
import SectionHeader from '@/components/wallet/shared/SectionHeader'
import { Send } from 'lucide-react'

export default function WalletPage() {
  const [mounted, setMounted] = useState(false)
  const { data: balance } = useWalletBalance()

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

      <Card className="mb-2">
        <WalletBalanceCard />
        <div className="mt-3">
          <WalletAddress />
        </div>
      </Card>

      <Card className="mb-2">
        <SectionHeader icon={Send} title="Send Transaction" />
        <SendTransactionForm availableBalance={availableBalance} />
      </Card>

      <RecentTransactions />
    </div>
  )
}
