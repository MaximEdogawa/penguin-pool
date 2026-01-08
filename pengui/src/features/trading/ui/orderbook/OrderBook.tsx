'use client'

import { useThemeClasses } from '@/shared/hooks'
import { useEffect, useMemo, useRef } from 'react'
import { useOrderBookFiltering } from '../../composables/useOrderBookFiltering'
import { useOrderBookResize } from '../../composables/useOrderBookResize'
import { useOrderBookTooltip } from '../../composables/useOrderBookTooltip'
import { formatPriceForDisplay } from '../../lib/formatAmount'
import type { OrderBookOrder } from '../../lib/orderBookTypes'
import { calculateAveragePrice } from '../../lib/services/priceCalculation'
import { useOrderBook } from '../../model/useOrderBook'
import OrderBookHeader from './OrderBookHeader'
import OrderBookResizeHandle from './OrderBookResizeHandle'
import OrderBookSection from './OrderBookSection'
import OrderTooltip from './OrderTooltip'

interface OrderBookProps {
  filters?: {
    buyAsset?: string[]
    sellAsset?: string[]
  }
  onOrderClick: (order: OrderBookOrder) => void
}

export default function OrderBook({ filters, onOrderClick }: OrderBookProps) {
  const { t } = useThemeClasses()
  const { orderBookData, orderBookLoading, orderBookHasMore, orderBookError } =
    useOrderBook(filters)

  // Use composables for filtering, resize, and tooltip
  const { filteredBuyOrders, filteredSellOrders, calculatePriceFn } = useOrderBookFiltering(
    orderBookData,
    filters
  )

  const { sellSectionHeight, buySectionHeight, startResize } = useOrderBookResize()

  const { hoveredOrder, tooltipPosition, tooltipVisible, updateTooltipPosition, hideTooltip } =
    useOrderBookTooltip()

  // Refs for scrolling
  const sellScrollRef = useRef<HTMLDivElement>(null)
  const buyScrollRef = useRef<HTMLDivElement>(null)

  // Calculate average price
  const averagePrice = useMemo(() => {
    if (!filters || (!filters.buyAsset && !filters.sellAsset)) {
      return 'N/A'
    }

    const bestSellOrder = filteredSellOrders[filteredSellOrders.length - 1]
    const bestBuyOrder = filteredBuyOrders[0]

    return calculateAveragePrice(
      bestSellOrder,
      bestBuyOrder,
      calculatePriceFn,
      formatPriceForDisplay
    )
  }, [filters, filteredSellOrders, filteredBuyOrders, calculatePriceFn])

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

  const emptyMessage = useMemo(() => {
    if (
      filters &&
      ((filters.buyAsset && filters.buyAsset.length > 0) ||
        (filters.sellAsset && filters.sellAsset.length > 0))
    ) {
      return 'No orders found matching your filters. Try adjusting your filters.'
    }
    return 'No orders found. Add filters to see orders.'
  }, [filters])

  const handleOrderClick = (order: OrderBookOrder) => {
    onOrderClick(order)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Order Book Display */}
      <div
        className={`${t.card} rounded-lg overflow-hidden border ${t.border} mt-1 mb-6 order-book-container flex-1 flex flex-col`}
      >
        {/* Header */}
        <OrderBookHeader filters={filters} />

        {/* Sell Orders Section */}
        <div
          ref={sellScrollRef}
          className="overflow-y-scroll sell-orders-section"
          style={{
            height: `${sellSectionHeight}%`,
          }}
        >
          <OrderBookSection
            orders={filteredSellOrders}
            orderType="sell"
            filters={filters}
            isLoading={orderBookLoading}
            error={orderBookError}
            onOrderClick={handleOrderClick}
            onHover={updateTooltipPosition}
            onMouseLeave={hideTooltip}
            justifyEnd
          />
        </div>

        {/* Resize Handle / Market Price Separator */}
        <OrderBookResizeHandle averagePrice={averagePrice} onMouseDown={startResize} />

        {/* Buy Orders Section */}
        <div
          ref={buyScrollRef}
          className="overflow-y-scroll buy-orders-section"
          style={{ height: `${buySectionHeight}%` }}
        >
          <OrderBookSection
            orders={filteredBuyOrders}
            orderType="buy"
            filters={filters}
            isLoading={orderBookLoading}
            error={orderBookError}
            hasMore={orderBookHasMore}
            totalOrders={orderBookData.length}
            onOrderClick={handleOrderClick}
            onHover={updateTooltipPosition}
            onMouseLeave={hideTooltip}
            emptyMessage={emptyMessage}
          />
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
