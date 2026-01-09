'use client'

import { useThemeClasses } from '@/shared/hooks'
import { getNativeTokenTicker } from '@/shared/lib/config/environment'
import type { OrderBookPagination } from '../../lib/orderBookTypes'
import OrderBookPaginationControls from './OrderBookPaginationControls'

interface OrderBookHeaderProps {
  filters?: {
    buyAsset?: string[]
    sellAsset?: string[]
  }
  pagination?: OrderBookPagination
  onPaginationChange?: (value: OrderBookPagination) => void
}

export default function OrderBookHeader({
  filters,
  pagination,
  onPaginationChange,
}: OrderBookHeaderProps) {
  const { t } = useThemeClasses()

  const getPriceHeaderTicker = (): string => {
    if (filters?.buyAsset && filters.buyAsset.length > 0) {
      return filters.buyAsset[0]
    }
    if (filters?.sellAsset && filters.sellAsset.length > 0) {
      return filters.sellAsset[0]
    }
    return getNativeTokenTicker()
  }

  return (
    <div
      className={`grid grid-cols-12 gap-2 px-3 py-2 ${t.card} border-b ${t.border} text-xs font-medium ${t.textSecondary}`}
    >
      <div className="col-span-1 text-left">Count</div>
      <div className="col-span-3 text-right">Buy</div>
      <div className="col-span-3 text-right">Sell</div>
      <div className="col-span-4 text-right">Price ({getPriceHeaderTicker()})</div>
      {pagination !== undefined && onPaginationChange && (
        <div className="col-span-1 flex items-center justify-end">
          <OrderBookPaginationControls value={pagination} onChange={onPaginationChange} />
        </div>
      )}
    </div>
  )
}
