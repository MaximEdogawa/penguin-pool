'use client'

import { useThemeClasses } from '@/shared/hooks'
import { getNativeTokenTicker } from '@/shared/lib/config/environment'

interface OrderBookHeaderProps {
  filters?: {
    buyAsset?: string[]
    sellAsset?: string[]
  }
}

export default function OrderBookHeader({ filters }: OrderBookHeaderProps) {
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
      className={`grid grid-cols-12 gap-2 px-2 py-1 backdrop-blur-xl ${t.card} border-b ${t.border} text-[10px] font-medium ${t.textSecondary} sticky top-0 z-10`}
      style={{
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Count */}
      <div className="col-span-1 text-left flex items-center">Count</div>

      {/* Buy */}
      <div className="col-span-3 text-right flex items-center justify-end">Buy</div>

      {/* Sell */}
      <div className="col-span-3 text-right flex items-center justify-end">Sell</div>

      {/* Price */}
      <div className="col-span-5 text-right flex items-center justify-end">
        <div className="flex items-center gap-1">
          <span className="text-[9px] opacity-70">({getPriceHeaderTicker()})</span>
          <span className="font-mono">Price</span>
        </div>
      </div>
    </div>
  )
}
