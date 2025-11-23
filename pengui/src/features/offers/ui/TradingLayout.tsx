'use client'

import TradingContent from './TradingContent'
import OrderBookFilters from './OrderBookFilters'
import MakerTakerTabs from './MakerTakerTabs'
import CreateOfferModal from './CreateOfferModal'
import { useOrderBookFilters } from '../model/useOrderBookFilters'
import { useOrderBookOfferSubmission } from '../model/useOrderBookOfferSubmission'
import { useThemeClasses } from '@/shared/hooks'
import { useCallback, useState } from 'react'
import type { OrderBookOrder } from '../lib/orderBookTypes'

interface TradingLayoutProps {
  activeTradingView?: 'orderbook' | 'chart' | 'depth' | 'trades'
  activeMode?: 'maker' | 'taker'
}

export default function TradingLayout({
  activeTradingView = 'orderbook',
  activeMode = 'taker',
}: TradingLayoutProps) {
  const { t } = useThemeClasses()
  const { filters } = useOrderBookFilters()
  const { fillFromOrderBook, useAsTemplate, resetForm } = useOrderBookOfferSubmission()

  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false)
  const [currentMode, setCurrentMode] = useState<'maker' | 'taker'>(activeMode)

  const handleOrderClick = useCallback(
    (order: OrderBookOrder) => {
      if (currentMode === 'taker') {
        // Taker mode: fill from order book (swap perspective)
        fillFromOrderBook(order)
      } else {
        // Maker mode: use as template (keep as-is)
        useAsTemplate(order)
      }
      setShowCreateOfferModal(true)
    },
    [currentMode, fillFromOrderBook, useAsTemplate]
  )

  const handleFiltersChange = useCallback(() => {
    // Filters change will trigger useOrderBook to refetch automatically
    // via the query key dependency
  }, [])

  const handleModeChange = useCallback(
    (mode: 'maker' | 'taker') => {
      setCurrentMode(mode)
      resetForm()
    },
    [resetForm]
  )

  return (
    <div className="flex h-full">
      {/* Left Panel with Order Book - Hidden on mobile */}
      <div className="hidden md:flex flex-col flex-1 min-w-0">
        <div className="mb-2">
          <OrderBookFilters onFiltersChange={handleFiltersChange} />
        </div>
        <div className="flex-1 min-h-0">
          <TradingContent
            activeView={activeTradingView}
            filters={filters}
            onOrderClick={handleOrderClick}
          />
        </div>
      </div>

      {/* Resize Handle - Hidden on mobile */}
      <div
        className={`hidden md:flex resize-handle m-1 ${t.card} hover:bg-gray-300 dark:hover:bg-gray-500 cursor-col-resize transition-colors items-center justify-center relative`}
        title="Drag to resize panels"
      >
        <div className="w-full flex items-center justify-center">
          <div className="flex items-center gap-1"></div>
        </div>
        {/* Invisible larger hit area */}
        <div className="absolute inset-0 w-6 h-full -left-1"></div>
      </div>

      {/* Right Panel with Trading Form - Full width on mobile */}
      <div className="flex flex-col w-full md:w-96 flex-shrink-0">
        <MakerTakerTabs activeMode={currentMode} onModeChange={handleModeChange} />
        <div className={`${t.card} p-4 rounded-lg border ${t.border} flex-1 overflow-y-auto`}>
          <div className="space-y-4">
            <div>
              <h3 className={`text-sm font-semibold ${t.text} mb-2`}>
                {currentMode === 'maker' ? 'Create Offer' : 'Take Offer'}
              </h3>
              <p className={`text-xs ${t.textSecondary} mb-4`}>
                {currentMode === 'maker'
                  ? 'Create a new trading offer. Click an order from the order book to use it as a template.'
                  : 'Click an order from the order book to take it, or create a new offer manually.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateOfferModal(true)}
              className={`w-full px-4 py-2 rounded-lg ${t.card} border ${t.border} ${t.text} ${t.cardHover} transition-colors text-sm font-medium`}
            >
              {currentMode === 'maker' ? 'Create New Offer' : 'Take Offer'}
            </button>
          </div>
        </div>
      </div>

      {/* Create Offer Modal */}
      {showCreateOfferModal && (
        <CreateOfferModal
          onClose={() => {
            setShowCreateOfferModal(false)
            resetForm()
          }}
          onOfferCreated={() => {
            setShowCreateOfferModal(false)
            resetForm()
            // Order book will auto-refresh via useOrderBook hook
          }}
        />
      )}
    </div>
  )
}
