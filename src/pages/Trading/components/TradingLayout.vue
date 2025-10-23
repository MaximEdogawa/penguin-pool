<template>
  <!-- Main Layout: Left Panel + Right Panel -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <!-- Left Panel with Trading Tabs -->
    <TradingTabs
      :active-trading-view="activeTradingView"
      :order-book-data="orderBookData"
      :order-book-loading="orderBookLoading"
      :order-book-has-more="orderBookHasMore"
      :shared-filters="sharedFilters"
      :shared-search-value="sharedSearchValue"
      :shared-filtered-suggestions="sharedFilteredSuggestions"
      @update:active-trading-view="updateActiveTradingView"
      @load-order-book-data="loadOrderBookData"
      @fill-from-order-book="fillFromOrderBook"
      @use-as-template="useAsTemplate"
    />

    <!-- Right Panel with Single Tab Menu -->
    <OfferTabs
      :active-view="activeView"
      :maker-assets="makerAssets"
      :taker-assets="takerAssets"
      :price-adjustment="priceAdjustment"
      :displayed-trades="displayedTrades"
      :loading="loading"
      :has-more="hasMore"
      :shared-filters="sharedFilters"
      :shared-search-value="sharedSearchValue"
      :shared-filtered-suggestions="sharedFilteredSuggestions"
      @update:active-view="updateActiveView"
      @submit="handleOfferSubmit"
      @load-data="loadData"
      @fill-from-order-book="fillFromOrderBook"
      @use-as-template="useAsTemplate"
    />
  </div>
</template>

<script setup lang="ts">
  import type {
    AssetItem,
    FilterState,
    OfferSubmitData,
    OrderBookOrder,
    SuggestionItem,
    Trade,
  } from '@/pages/Trading/types'
  import OfferTabs from './OfferTabs.vue'
  import TradingTabs from './TradingTabs.vue'

  interface Props {
    activeTradingView: 'orderbook' | 'chart' | 'depth' | 'trades'
    activeView: 'create' | 'take' | 'history'
    orderBookData: OrderBookOrder[]
    orderBookLoading: boolean
    orderBookHasMore: boolean
    makerAssets: AssetItem[]
    takerAssets: AssetItem[]
    priceAdjustment: number
    displayedTrades: Trade[]
    loading: boolean
    hasMore: boolean
    sharedFilters: FilterState
    sharedSearchValue: string
    sharedFilteredSuggestions: SuggestionItem[]
  }

  interface Emits {
    (e: 'update:activeTradingView', value: 'orderbook' | 'chart' | 'depth' | 'trades'): void
    (e: 'update:activeView', value: 'create' | 'take' | 'history'): void
    (e: 'loadOrderBookData'): void
    (e: 'loadData'): void
    (e: 'submit', data: OfferSubmitData): void
    (e: 'fillFromOrderBook', order: OrderBookOrder): void
    (e: 'useAsTemplate', order: OrderBookOrder): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  const updateActiveTradingView = (value: 'orderbook' | 'chart' | 'depth' | 'trades') => {
    emit('update:activeTradingView', value)
  }

  const updateActiveView = (value: 'create' | 'take' | 'history') => {
    emit('update:activeView', value)
  }

  const loadOrderBookData = () => {
    emit('loadOrderBookData')
  }

  const loadData = () => {
    emit('loadData')
  }

  const handleOfferSubmit = (data: OfferSubmitData) => {
    emit('submit', data)
  }

  const fillFromOrderBook = (order: OrderBookOrder) => {
    emit('fillFromOrderBook', order)
  }

  const useAsTemplate = (order: OrderBookOrder) => {
    emit('useAsTemplate', order)
  }
</script>
