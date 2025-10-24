<template>
  <!-- Main Layout: Left Panel + Resize Handle + Right Panel -->
  <div class="flex h-full">
    <!-- Left Panel with Trading Tabs - Hidden on mobile and small screens -->
    <div class="hidden md:flex flex-col" :style="{ width: `${leftPanelWidth}%` }">
      <TradingTabs
        :active-trading-view="activeTradingView"
        :order-book-data="orderBookData"
        :order-book-loading="orderBookLoading"
        :order-book-has-more="orderBookHasMore"
        :shared-filters="sharedFilters"
        :shared-search-value="sharedSearchValue"
        :shared-filtered-suggestions="sharedFilteredSuggestions"
        @update:active-trading-view="updateActiveTradingView"
        @refresh-order-book="refreshOrderBook"
        @fill-from-order-book="fillFromOrderBook"
        @use-as-template="useAsTemplate"
      />
    </div>

    <!-- Resize Handle - Hidden on mobile and small screens -->
    <div
      class="hidden md:flex resize-handle m-1 bg-gray-200 dark:bg-gray-900 hover:bg-gray-300 dark:hover:bg-gray-500 cursor-col-resize transition-colors items-center justify-center relative"
      @mousedown="startResize"
      title="Drag to resize panels"
    >
      <div class="w-full flex items-center justify-center">
        <div class="flex items-center gap-1"></div>
      </div>
      <!-- Invisible larger hit area -->
      <div class="absolute inset-0 w-6 h-full -left-1"></div>
    </div>

    <!-- Right Panel with Single Tab Menu - Full width on mobile and small screens -->
    <div
      class="flex flex-col w-full md:w-auto"
      :style="{ width: isMobile ? '100%' : `${rightPanelWidth}%` }"
    >
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
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import OfferTabs from './OfferTabs.vue'
  import TradingTabs from './TradingTabs.vue'

  interface Props {
    activeTradingView: 'orderbook' | 'chart' | 'depth' | 'trades'
    activeView: 'create' | 'take' | 'history'
    orderBookData: OrderBookOrder[]
    orderBookLoading: boolean
    orderBookHasMore: boolean
    orderBookError?: unknown
    orderBookTotal?: number
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
    (e: 'refreshOrderBook'): void
    (e: 'loadData'): void
    (e: 'submit', data: OfferSubmitData): void
    (e: 'fillFromOrderBook', order: OrderBookOrder): void
    (e: 'useAsTemplate', order: OrderBookOrder): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()

  // Window width tracking for responsive behavior
  const windowWidth = ref(window.innerWidth)
  const isMobile = computed(() => windowWidth.value < 768)

  // Resize state
  const leftPanelWidth = ref(50)
  const rightPanelWidth = ref(50)

  // Track window resize
  const handleResize = () => {
    windowWidth.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  const updateActiveTradingView = (value: 'orderbook' | 'chart' | 'depth' | 'trades') => {
    emit('update:activeTradingView', value)
  }

  const updateActiveView = (value: 'create' | 'take' | 'history') => {
    emit('update:activeView', value)
  }

  const refreshOrderBook = () => {
    emit('refreshOrderBook')
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

  const startResize = (event: MouseEvent) => {
    event.preventDefault()
    const startX = event.clientX
    const startLeftWidth = leftPanelWidth.value
    const containerElement = document.querySelector('.flex.h-full')
    const containerWidth = containerElement?.clientWidth || 800

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaPercent = (deltaX / containerWidth) * 100
      const newLeftWidth = Math.max(20, Math.min(80, startLeftWidth + deltaPercent))
      const newRightWidth = 100 - newLeftWidth

      leftPanelWidth.value = newLeftWidth
      rightPanelWidth.value = newRightWidth
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
</script>

<style scoped>
  .resize-handle {
    width: 1px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-left: 1px solid #e5e7eb;
    border-right: 1px solid #e5e7eb;
    position: relative;
    z-index: 10;
  }

  .resize-handle:hover {
    background-color: #d1d5db;
    border-left-color: #9ca3af;
    border-right-color: #9ca3af;
  }

  .dark .resize-handle {
    border-left-color: #4b5563;
    border-right-color: #4b5563;
  }

  .dark .resize-handle:hover {
    background-color: #4b5563;
    border-left-color: #6b7280;
    border-right-color: #6b7280;
  }

  /* Prevent hover tooltips from interfering with resize handle */
  .resize-handle * {
    pointer-events: none;
  }
</style>
