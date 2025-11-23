'use client'

import { useCatTokens } from '@/shared/hooks/useTickers'
import type { OrderBookOrder } from '../lib/orderBookTypes'
import { useCallback, useMemo } from 'react'
import { getNativeTokenTicker } from '@/shared/lib/config/environment'

interface OrderRowProps {
  order: OrderBookOrder
  orderType: 'buy' | 'sell'
  filters?: {
    buyAsset?: string[]
    sellAsset?: string[]
  }
  onClick: (order: OrderBookOrder) => void
  onHover: (event: React.MouseEvent, order: OrderBookOrder, orderType: 'buy' | 'sell') => void
  onMouseLeave: () => void
}

const formatAmount = (amount: number): string => {
  if (amount === 0) return '0'
  if (amount < 0.000001) return amount.toExponential(2)
  if (amount < 0.01) return amount.toFixed(6)
  if (amount < 1) return amount.toFixed(4)
  if (amount < 100) return amount.toFixed(2)
  if (amount < 10000) return amount.toFixed(1)
  return amount.toFixed(0)
}

const isSingleAssetPair = (order: OrderBookOrder): boolean => {
  return order.offering.length === 1 && order.receiving.length === 1
}

export default function OrderRow({
  order,
  orderType,
  filters,
  onClick,
  onHover,
  onMouseLeave,
}: OrderRowProps) {
  const { getCatTokenInfo } = useCatTokens()

  const getTickerSymbol = useCallback(
    (assetId: string, code?: string): string => {
      if (code) return code
      if (!assetId) return getNativeTokenTicker()
      const tickerInfo = getCatTokenInfo(assetId)
      return tickerInfo?.ticker || assetId.slice(0, 8)
    },
    [getCatTokenInfo]
  )

  const calculateOrderPrice = useCallback((): string => {
    if (isSingleAssetPair(order)) {
      const receivingAsset = order.receiving[0]
      const offeringAsset = order.offering[0]

      if (
        receivingAsset &&
        offeringAsset &&
        receivingAsset.amount > 0 &&
        offeringAsset.amount > 0
      ) {
        let price

        if (
          filters?.buyAsset &&
          filters.buyAsset.length > 0 &&
          filters?.sellAsset &&
          filters.sellAsset.length > 0
        ) {
          // Calculate price based on what you're buying (buyAsset) vs what you're selling (sellAsset)
          // Price should always be: sellAsset/buyAsset (how much sell asset per buy asset)

          // Determine which asset is the buy asset and which is the sell asset
          const receivingIsBuyAsset = filters.buyAsset.some(
            (filterAsset) =>
              getTickerSymbol(receivingAsset.id, receivingAsset.code).toLowerCase() ===
                filterAsset.toLowerCase() ||
              receivingAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
              (receivingAsset.code &&
                receivingAsset.code.toLowerCase() === filterAsset.toLowerCase())
          )

          const offeringIsBuyAsset = filters.buyAsset.some(
            (filterAsset) =>
              getTickerSymbol(offeringAsset.id, offeringAsset.code).toLowerCase() ===
                filterAsset.toLowerCase() ||
              offeringAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
              (offeringAsset.code && offeringAsset.code.toLowerCase() === filterAsset.toLowerCase())
          )

          if (receivingIsBuyAsset && !offeringIsBuyAsset) {
            // Receiving buy asset, offering sell asset
            // Price = sell asset amount / buy asset amount
            price = offeringAsset.amount / receivingAsset.amount
          } else if (offeringIsBuyAsset && !receivingIsBuyAsset) {
            // Offering buy asset, receiving sell asset
            // Price = sell asset amount / buy asset amount
            price = receivingAsset.amount / offeringAsset.amount
          } else {
            // Fallback to original logic
            price = offeringAsset.amount / receivingAsset.amount
          }

          // Format price with appropriate precision
          return `${formatAmount(price)}`
        } else {
          // No filters, show price as offered/received
          price = offeringAsset.amount / receivingAsset.amount
          return `${formatAmount(price)}`
        }
      }
    }

    // For multiple asset pairs, show USD total
    return `$${order.offeringUsdValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }, [order, filters, getTickerSymbol])

  const depthWidth = useMemo(() => {
    // Calculate depth indicator width (0-100%)
    return `${Math.min(100, (parseInt(order.id) % 8) * 15)}%`
  }, [order.id])

  const bgColorClass =
    orderType === 'sell'
      ? 'bg-red-100 dark:bg-red-900 opacity-20 group-hover:opacity-30'
      : 'bg-green-100 dark:bg-green-900 opacity-20 group-hover:opacity-30'

  const textColorClass =
    orderType === 'sell' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'

  return (
    <div
      className="w-full group relative mb-1 cursor-pointer"
      onClick={() => onClick(order)}
      onMouseMove={(e) => onHover(e, order, orderType)}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`absolute inset-0 ${bgColorClass} transition-opacity`}
        style={{ width: depthWidth, right: 0 }}
      />

      <div className="relative grid grid-cols-10 gap-2 py-2 text-sm items-center">
        {/* Count */}
        <div className="col-span-2 text-right text-gray-500 dark:text-gray-500 font-mono text-xs">
          {order.offering.length + order.receiving.length}
        </div>

        {/* Receive */}
        <div className="col-span-3 text-right">
          <div className="flex flex-col gap-1">
            {order.receiving.map((item, idx) => (
              <div key={idx} className={`${textColorClass} font-mono text-xs`}>
                {formatAmount(item.amount || 0)} {item.code || getTickerSymbol(item.id)}
              </div>
            ))}
          </div>
        </div>

        {/* Request */}
        <div className="col-span-3 text-right">
          <div className="flex flex-col gap-1">
            {order.offering.map((item, idx) => (
              <div key={idx} className="text-xs font-mono text-gray-700 dark:text-gray-300">
                {formatAmount(item.amount || 0)} {item.code || getTickerSymbol(item.id)}
              </div>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="col-span-2 text-right text-gray-600 dark:text-gray-400 font-mono text-xs">
          {calculateOrderPrice()}
        </div>
      </div>
    </div>
  )
}
