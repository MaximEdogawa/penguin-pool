import { useThemeClasses } from '@/shared/hooks'
import { Loader2 } from 'lucide-react'
import type { OrderBookOrder } from '../../lib/orderBookTypes'
import OrderRow from './OrderRow'

interface OrderBookSectionProps {
  orders: OrderBookOrder[]
  orderType: 'buy' | 'sell'
  filters?: {
    buyAsset?: string[]
    sellAsset?: string[]
  }
  isLoading?: boolean
  error?: Error | null
  hasMore?: boolean
  totalOrders?: number
  onOrderClick: (order: OrderBookOrder) => void
  onHover: (event: React.MouseEvent, order: OrderBookOrder, orderType: 'buy' | 'sell') => void
  onMouseLeave: () => void
  justifyEnd?: boolean
  emptyMessage?: string
  detailsMap?: Map<
    string,
    {
      offerString?: string
      fullMakerAddress?: string
    }
  >
  registerOrderElement?: (orderId: string, element: HTMLElement | null) => void
  isLoadingDetails?: boolean
}

export default function OrderBookSection({
  orders,
  orderType,
  filters,
  isLoading,
  error,
  hasMore,
  totalOrders,
  onOrderClick,
  onHover,
  onMouseLeave,
  justifyEnd = false,
  emptyMessage,
  detailsMap,
  registerOrderElement,
  isLoadingDetails,
}: OrderBookSectionProps) {
  const { t } = useThemeClasses()

  return (
    <div>
      <div className={`px-3 py-2 ${justifyEnd ? 'flex flex-col justify-end min-h-full' : ''}`}>
        {isLoading && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className={`ml-2 text-xs ${t.textSecondary}`}>Loading orders...</span>
          </div>
        )}

        {error && (
          <div className={`text-center py-4 text-xs ${t.textSecondary}`}>
            Error loading orders. Please try again.
          </div>
        )}

        {orders.map((order) => (
          <OrderRow
            key={`${orderType}-${order.id}`}
            order={order}
            orderType={orderType}
            filters={filters}
            onClick={onOrderClick}
            onHover={onHover}
            onMouseLeave={onMouseLeave}
            detailedData={detailsMap?.get(order.id)}
            registerElement={registerOrderElement}
            isLoadingDetails={isLoadingDetails}
          />
        ))}

        {!hasMore && totalOrders && totalOrders > 0 && (
          <div className={`text-right py-4 ${t.textSecondary} text-xs`}>No more orders</div>
        )}

        {!isLoading && !error && orders.length === 0 && emptyMessage && (
          <div className={`text-center py-8 ${t.textSecondary} text-sm`}>{emptyMessage}</div>
        )}
      </div>
    </div>
  )
}
