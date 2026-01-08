/**
 * Trading Feature
 * Exports for the trading feature
 */

// Model exports
export { useOrderBook } from './model/useOrderBook'
export { useOrderBookFilters, OrderBookFiltersProvider } from './model/OrderBookFiltersProvider'
export { useOrderBookOfferSubmission } from './model/useOrderBookOfferSubmission'

// UI exports
export { default as OrderBook } from './ui/orderbook/OrderBook'
export { default as OrderBookFilters } from './ui/orderbook/OrderBookFilters'
export { default as OrderRow } from './ui/orderbook/OrderRow'
export { default as OrderTooltip } from './ui/orderbook/OrderTooltip'
export { default as TradingLayout } from './ui/layout/TradingLayout'
export { default as TradingContent } from './ui/layout/TradingContent'
export { default as FilterPanel } from './ui/layout/FilterPanel'
export { default as MakerTakerTabs } from './ui/layout/MakerTakerTabs'
export { default as CreateOfferModal } from './ui/modals/CreateOfferModal'
export { default as TakeOfferModal } from './ui/modals/TakeOfferModal'

// Type exports
export type {
  OrderBookOrder,
  OrderBookFilters as OrderBookFiltersType,
  OrderBookQueryResult,
  SuggestionItem,
  DexieAssetItem,
} from './lib/orderBookTypes'
