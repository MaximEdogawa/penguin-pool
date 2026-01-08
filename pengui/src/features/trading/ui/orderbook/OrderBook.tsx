'use client'

import { useOrderBook } from '../../model/useOrderBook'
import type { OrderBookOrder } from '../../lib/orderBookTypes'
import OrderRow from './OrderRow'
import OrderTooltip from './OrderTooltip'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useThemeClasses } from '@/shared/hooks'
import { getNativeTokenTicker } from '@/shared/lib/config/environment'

interface OrderBookProps {
  filters?: {
    buyAsset?: string[]
    sellAsset?: string[]
  }
  onOrderClick: (order: OrderBookOrder) => void
}

export default function OrderBook({ filters, onOrderClick }: OrderBookProps) {
  const { t } = useThemeClasses()
  // Pass filters directly - useOrderBook will react to changes via query key
  const { orderBookData, orderBookLoading, orderBookHasMore, orderBookError } =
    useOrderBook(filters)

  // Resize state
  const [sellSectionHeight, setSellSectionHeight] = useState(50)
  const [buySectionHeight, setBuySectionHeight] = useState(50)

  // Tooltip state
  const [hoveredOrder, setHoveredOrder] = useState<OrderBookOrder | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [tooltipVisible, setTooltipVisible] = useState(false)

  // Refs for scrolling
  const sellScrollRef = useRef<HTMLDivElement>(null)
  const buyScrollRef = useRef<HTMLDivElement>(null)

  const getPriceHeaderTicker = useCallback((): string => {
    // Price is expressed in terms of the sell asset (what you're giving up)
    // If we have sell asset filters, use the first one
    if (filters?.sellAsset && filters.sellAsset.length > 0) {
      return filters.sellAsset[0]
    }

    // If we have buy asset filters, use the first one
    if (filters?.buyAsset && filters.buyAsset.length > 0) {
      return filters.buyAsset[0]
    }

    // Default fallback
    return getNativeTokenTicker()
  }, [filters])

  // Separate orders into buy and sell based on order type
  // The API already filters by assets, so we just need to separate by order type
  const filteredSellOrders = useMemo(() => {
    // Sell orders: orders where native token (XCH/TXCH) is being offered
    const nativeTicker = getNativeTokenTicker()
    return orderBookData
      .filter((order) => {
        // Check if this is a sell order (offering native token)
        return order.offering.some(
          (asset) => asset.code === nativeTicker || asset.code === 'XCH' || asset.code === 'TXCH'
        )
      })
      .sort((a, b) => {
        // Sort sell orders by price descending (high to low)
        return b.pricePerUnit - a.pricePerUnit
      })
  }, [orderBookData])

  const filteredBuyOrders = useMemo(() => {
    // Buy orders: orders where native token (XCH/TXCH) is being requested
    const nativeTicker = getNativeTokenTicker()
    return orderBookData
      .filter((order) => {
        // Check if this is a buy order (requesting native token)
        return order.receiving.some(
          (asset) => asset.code === nativeTicker || asset.code === 'XCH' || asset.code === 'TXCH'
        )
      })
      .sort((a, b) => {
        // Sort buy orders by price ascending (low to high)
        return a.pricePerUnit - b.pricePerUnit
      })
  }, [orderBookData])

  const calculateAveragePrice = useCallback((): string => {
    if (
      !filters ||
      !filters.buyAsset ||
      filters.buyAsset.length === 0 ||
      !filters.sellAsset ||
      filters.sellAsset.length === 0
    ) {
      return 'N/A'
    }

    // Get best sell price (lowest ask)
    const bestSellOrder = filteredSellOrders[0]
    const bestSellPrice = bestSellOrder
      ? bestSellOrder.receiving[0]?.amount / bestSellOrder.offering[0]?.amount
      : 0

    // Get best buy price (highest bid)
    const bestBuyOrder = filteredBuyOrders[0]
    const bestBuyPrice = bestBuyOrder
      ? bestBuyOrder.offering[0]?.amount / bestBuyOrder.receiving[0]?.amount
      : 0

    // Calculate average if both prices exist
    if (bestSellPrice > 0 && bestBuyPrice > 0) {
      const averagePrice = (bestSellPrice + bestBuyPrice) / 2
      const formatAmount = (amount: number): string => {
        if (amount < 0.01) return amount.toFixed(6)
        if (amount < 1) return amount.toFixed(4)
        if (amount < 100) return amount.toFixed(2)
        return amount.toFixed(1)
      }
      return formatAmount(averagePrice)
    }

    // Fallback to individual prices if only one exists
    if (bestSellPrice > 0) {
      const formatAmount = (amount: number): string => {
        if (amount < 0.01) return amount.toFixed(6)
        if (amount < 1) return amount.toFixed(4)
        if (amount < 100) return amount.toFixed(2)
        return amount.toFixed(1)
      }
      return formatAmount(bestSellPrice)
    }
    if (bestBuyPrice > 0) {
      const formatAmount = (amount: number): string => {
        if (amount < 0.01) return amount.toFixed(6)
        if (amount < 1) return amount.toFixed(4)
        if (amount < 100) return amount.toFixed(2)
        return amount.toFixed(1)
      }
      return formatAmount(bestBuyPrice)
    }

    return 'N/A'
  }, [filters, filteredSellOrders, filteredBuyOrders])

  const handleOrderClick = useCallback(
    (order: OrderBookOrder) => {
      onOrderClick(order)
    },
    [onOrderClick]
  )

  const updateTooltipPosition = useCallback(
    (event: React.MouseEvent, order: OrderBookOrder, _orderType: 'buy' | 'sell') => {
      setHoveredOrder(order)
      setTooltipPosition({ x: event.clientX, y: event.clientY })
      setTooltipVisible(true)
    },
    []
  )

  const hideTooltip = useCallback(() => {
    setTooltipVisible(false)
    setHoveredOrder(null)
  }, [])

  const startResize = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      const startY = event.clientY
      const startSellHeight = sellSectionHeight
      const containerElement = document.querySelector('.order-book-container')
      const containerHeight = containerElement?.clientHeight || 400

      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = e.clientY - startY
        const deltaPercent = (deltaY / containerHeight) * 100
        const newSellHeight = Math.max(20, Math.min(80, startSellHeight + deltaPercent))
        const newBuyHeight = 100 - newSellHeight

        setSellSectionHeight(newSellHeight)
        setBuySectionHeight(newBuyHeight)
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [sellSectionHeight]
  )

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    if (!buyScrollRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && orderBookHasMore && !orderBookLoading) {
          // Load more would be handled by parent component
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(buyScrollRef.current)

    return () => {
      observer.disconnect()
    }
  }, [orderBookHasMore, orderBookLoading])

  const allFilteredOrders = useMemo(() => {
    return [...filteredSellOrders, ...filteredBuyOrders]
  }, [filteredSellOrders, filteredBuyOrders])

  return (
    <div className="h-full flex flex-col">
      {/* Order Book Display */}
      <div
        className={`${t.card} rounded-lg overflow-hidden border ${t.border} mt-1 mb-6 order-book-container flex-1 flex flex-col`}
      >
        {/* Header */}
        <div
          className={`grid grid-cols-10 gap-2 px-3 py-2 ${t.card} border-b ${t.border} text-xs font-medium ${t.textSecondary}`}
        >
          <div className="col-span-2 text-right">Count</div>
          <div className="col-span-3 text-right">Receive</div>
          <div className="col-span-3 text-right">Request</div>
          <div className="col-span-2 text-right">Price ({getPriceHeaderTicker()})</div>
        </div>

        {/* Sell Orders (Asks) - Top Section */}
        <div
          ref={sellScrollRef}
          className="overflow-y-scroll sell-orders-section"
          style={{
            height: `${sellSectionHeight}%`,
          }}
        >
          <div className="px-3 py-2 flex flex-col justify-end min-h-full">
            {orderBookLoading && (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className={`ml-2 text-xs ${t.textSecondary}`}>Loading orders...</span>
              </div>
            )}

            {orderBookError && (
              <div className={`text-center py-4 text-xs ${t.textSecondary}`}>
                Error loading orders. Please try again.
              </div>
            )}

            {filteredSellOrders.map((order) => (
              <OrderRow
                key={`sell-${order.id}`}
                order={order}
                orderType="sell"
                filters={filters}
                onClick={handleOrderClick}
                onHover={updateTooltipPosition}
                onMouseLeave={hideTooltip}
              />
            ))}
          </div>
        </div>

        {/* Resize Handle / Market Price Separator */}
        <div
          className={`resize-handle ${t.card} hover:bg-gray-300 dark:hover:bg-gray-500 cursor-row-resize transition-colors flex items-center justify-center relative`}
          onMouseDown={startResize}
          title="Drag to resize sections"
        >
          <div className="w-full flex items-center justify-between px-3">
            <div className="flex items-center gap-1"></div>
          </div>

          {/* Invisible larger hit area */}
          <div className="absolute inset-0 w-full h-6 -top-1 pr-2"></div>
          <div className="text-sm font-bold text-blue-700 dark:text-blue-300 font-mono pr-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm">
            {calculateAveragePrice()}
          </div>
        </div>

        {/* Buy Orders (Bids) */}
        <div
          ref={buyScrollRef}
          className="overflow-y-scroll buy-orders-section"
          style={{ height: `${buySectionHeight}%` }}
        >
          <div className="px-3 py-2">
            {filteredBuyOrders.map((order) => (
              <OrderRow
                key={`buy-${order.id}`}
                order={order}
                orderType="buy"
                filters={filters}
                onClick={handleOrderClick}
                onHover={updateTooltipPosition}
                onMouseLeave={hideTooltip}
              />
            ))}

            {!orderBookHasMore && orderBookData.length > 0 && (
              <div className={`text-right py-4 ${t.textSecondary} text-xs`}>No more orders</div>
            )}

            {!orderBookLoading && !orderBookError && allFilteredOrders.length === 0 && (
              <div className={`text-center py-8 ${t.textSecondary} text-sm`}>
                {filters &&
                ((filters.buyAsset && filters.buyAsset.length > 0) ||
                  (filters.sellAsset && filters.sellAsset.length > 0))
                  ? 'No orders found matching your filters. Try adjusting your filters.'
                  : 'No orders found. Add filters to see orders.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Tooltip */}
      <OrderTooltip
        order={hoveredOrder}
        visible={tooltipVisible}
        position={tooltipPosition}
        direction={hoveredOrder && filteredBuyOrders.includes(hoveredOrder) ? 'top' : 'bottom'}
      />
    </div>
  )
}
