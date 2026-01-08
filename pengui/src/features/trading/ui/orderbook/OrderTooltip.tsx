'use client'

import { useCatTokens } from '@/shared/hooks/useTickers'
import type { OrderBookOrder } from '../../lib/orderBookTypes'
import { useMemo } from 'react'
import { getNativeTokenTicker } from '@/shared/lib/config/environment'
import { formatAmountForTooltip } from '../../lib/formatAmount'

interface OrderTooltipProps {
  order: OrderBookOrder | null
  visible: boolean
  position: { x: number; y: number }
  direction: 'top' | 'bottom'
}

// Mock USD prices for assets
const USD_PRICES: Record<string, number> = {
  TXCH: 30,
  XCH: 30,
  BTC: 122013,
  ETH: 3500,
  USDT: 1,
  USDC: 1,
  SOL: 120,
  MATIC: 0.85,
  AVAX: 35,
  LINK: 15,
}

const calculateAssetUsdValue = (asset: { code: string; amount: number }): number => {
  if (asset.code === 'USDC' || asset.code === 'USDT') {
    return asset.amount
  } else {
    return asset.amount * (USD_PRICES[asset.code] || 1)
  }
}

export default function OrderTooltip({ order, visible, position, direction }: OrderTooltipProps) {
  const { getCatTokenInfo } = useCatTokens()

  const getTickerSymbol = (assetId: string, code?: string): string => {
    if (code) return code
    if (!assetId) return getNativeTokenTicker()
    const tickerInfo = getCatTokenInfo(assetId)
    return tickerInfo?.ticker || assetId.slice(0, 8)
  }

  const tooltipStyle = useMemo(() => {
    if (!visible || !order) return { display: 'none' }

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let left = position.x + 10
    let top: number

    // Position tooltip based on direction
    if (direction === 'top') {
      // Tooltip appears above - estimate height as 200px
      top = position.y - 200 - 10
    } else {
      // Tooltip appears below
      top = position.y + 10
    }

    // Adjust if tooltip would go off screen horizontally
    if (left + 300 > viewportWidth) {
      left = position.x - 300 - 10
    }

    // Adjust if tooltip would go off screen vertically
    if (direction === 'top' && top < 10) {
      // If top tooltip would go off top, show it below instead
      top = position.y + 10
    } else if (direction === 'bottom' && top + 200 > viewportHeight) {
      // If bottom tooltip would go off bottom, show it above instead
      top = position.y - 200 - 10
    }

    // Ensure tooltip doesn't go off the left edge
    if (left < 10) {
      left = 10
    }

    // Ensure tooltip doesn't go off the top edge
    if (top < 10) {
      top = 10
    }

    return {
      position: 'fixed' as const,
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 50,
    }
  }, [visible, order, position, direction])

  if (!visible || !order) {
    return null
  }

  return (
    <div
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-lg p-3 shadow-xl min-w-[300px] max-w-[500px] pointer-events-none"
      style={tooltipStyle}
    >
      <div className="space-y-2">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">Order Details</div>

        {/* Order ID */}
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">ID:</span>
          <span className="text-xs font-mono text-gray-900 dark:text-white ml-1 break-all">
            {order.id}
          </span>
        </div>

        {/* Buy Assets */}
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Buy:</span>
          <div className="mt-1 space-y-1">
            {order.offering.map((asset, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-gray-900 dark:text-white">
                  {asset.code || getTickerSymbol(asset.id)}
                </span>
                <div className="flex flex-col items-end">
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {formatAmountForTooltip(asset.amount || 0)}
                  </span>
                  <span className="font-mono text-xs text-green-600 dark:text-green-400">
                    ${calculateAssetUsdValue(asset).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sell Assets */}
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Sell:</span>
          <div className="mt-1 space-y-1">
            {order.receiving.map((asset, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-gray-900 dark:text-white">
                  {asset.code || getTickerSymbol(asset.id)}
                </span>
                <div className="flex flex-col items-end">
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {formatAmountForTooltip(asset.amount || 0)}
                  </span>
                  <span className="font-mono text-xs text-green-600 dark:text-green-400">
                    ${calculateAssetUsdValue(asset).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(order.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  )
}
