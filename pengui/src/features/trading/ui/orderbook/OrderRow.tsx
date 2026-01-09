'use client'

import { useCatTokens } from '@/shared/hooks/useTickers'
import { getNativeTokenTicker } from '@/shared/lib/config/environment'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  formatAmountForDisplay,
  formatAmountForTooltip,
  formatPriceForDisplay,
} from '../../lib/formatAmount'
import type { OrderBookOrder } from '../../lib/orderBookTypes'

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
  detailedData?: {
    offerString?: string
    fullMakerAddress?: string
  }
  registerElement?: (orderId: string, element: HTMLElement | null) => void
  isLoadingDetails?: boolean
}

const isSingleAssetPair = (order: OrderBookOrder): boolean => {
  return order.offering.length === 1 && order.requesting.length === 1
}

export default function OrderRow({
  order,
  orderType,
  filters,
  onClick,
  onHover,
  onMouseLeave,
  detailedData,
  registerElement,
  isLoadingDetails,
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
      const requestingAsset = order.requesting[0]
      const offeringAsset = order.offering[0]

      if (
        requestingAsset &&
        offeringAsset &&
        requestingAsset.amount > 0 &&
        offeringAsset.amount > 0
      ) {
        let price

        if (
          filters?.buyAsset &&
          filters.buyAsset.length > 0 &&
          filters?.sellAsset &&
          filters.sellAsset.length > 0
        ) {
          // Calculate price from buy side perspective: buyAsset/sellAsset
          // Example: buy TXCH, sell TDBX -> price = TXCH/TDBX (how much buyAsset per sellAsset)

          // Determine which asset is the buy asset and which is the sell asset
          const requestingIsBuyAsset = filters.buyAsset.some(
            (filterAsset) =>
              getTickerSymbol(requestingAsset.id, requestingAsset.code).toLowerCase() ===
                filterAsset.toLowerCase() ||
              requestingAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
              (requestingAsset.code &&
                requestingAsset.code.toLowerCase() === filterAsset.toLowerCase())
          )

          const offeringIsBuyAsset = filters.buyAsset.some(
            (filterAsset) =>
              getTickerSymbol(offeringAsset.id, offeringAsset.code).toLowerCase() ===
                filterAsset.toLowerCase() ||
              offeringAsset.id.toLowerCase() === filterAsset.toLowerCase() ||
              (offeringAsset.code && offeringAsset.code.toLowerCase() === filterAsset.toLowerCase())
          )

          // Always calculate from buy side: buyAsset amount / sellAsset amount
          if (requestingIsBuyAsset && !offeringIsBuyAsset) {
            // requesting buy asset, offering sell asset
            // Price = buy asset amount / sell asset amount (TXCH/TDBX)
            price = requestingAsset.amount / offeringAsset.amount
          } else if (offeringIsBuyAsset && !requestingIsBuyAsset) {
            // Offering buy asset, requesting sell asset
            // Price = buy asset amount / sell asset amount (TXCH/TDBX)
            price = offeringAsset.amount / requestingAsset.amount
          } else {
            // Fallback to original logic
            price = offeringAsset.amount / requestingAsset.amount
          }

          // Format price (cut decimals, no truncation indicator)
          return formatPriceForDisplay(price)
        } else {
          // No filters, show price as offered/received
          price = offeringAsset.amount / requestingAsset.amount
          return formatPriceForDisplay(price)
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

  // Register element for viewport detection
  const rowRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (registerElement && rowRef.current) {
      registerElement(order.id, rowRef.current)
    }
    return () => {
      if (registerElement) {
        registerElement(order.id, null)
      }
    }
  }, [order.id, registerElement])

  // Detailed data is available via detailedData prop when loaded

  return (
    <div
      ref={rowRef}
      className="w-full group relative mb-1 cursor-pointer"
      onClick={() => onClick(order)}
      onMouseMove={(e) => onHover(e, order, orderType)}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`absolute inset-0 ${bgColorClass} transition-opacity`}
        style={{ width: depthWidth, right: 0 }}
      />

      <div className="relative grid grid-cols-12 gap-2 px-2 py-1.5 items-center">
        {/* Count - smallest, left aligned */}
        <div className="col-span-1 text-left text-gray-500 dark:text-gray-500 font-mono text-[10px]">
          {order.offering.length + order.requesting.length}
        </div>

        {/* Buy */}
        <div className="col-span-3 text-right min-w-0">
          <div className="flex flex-col gap-0.5">
            {order.offering.map((item, idx) => (
              <div
                key={idx}
                className={`${textColorClass} font-mono text-[10px] truncate`}
                title={`${formatAmountForTooltip(item.amount || 0)} ${item.code || getTickerSymbol(item.id)}`}
              >
                {formatAmountForDisplay(item.amount || 0)} {item.code || getTickerSymbol(item.id)}
              </div>
            ))}
          </div>
        </div>

        {/* Sell */}
        <div className="col-span-3 text-right min-w-0">
          <div className="flex flex-col gap-0.5">
            {order.requesting.map((item, idx) => (
              <div
                key={idx}
                className="text-[10px] font-mono text-gray-700 dark:text-gray-300 truncate"
                title={`${formatAmountForTooltip(item.amount || 0)} ${item.code || getTickerSymbol(item.id)}`}
              >
                {formatAmountForDisplay(item.amount || 0)} {item.code || getTickerSymbol(item.id)}
              </div>
            ))}
          </div>
        </div>

        {/* Price - biggest, right aligned */}
        <div className="col-span-5 text-right text-gray-600 dark:text-gray-400 font-mono text-[10px] truncate min-w-0 flex items-center justify-end gap-1">
          {isLoadingDetails && !detailedData && (
            <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
          )}
          <span title={calculateOrderPrice()}>{calculateOrderPrice()}</span>
        </div>
      </div>
    </div>
  )
}
