<template>
  <div class="content-page">
    <div class="content-body">
      <!-- Main Trading Layout -->
      <TradingLayout
        :active-trading-view="activeTradingView"
        :active-view="activeView"
        :order-book-data="orderBookData"
        :order-book-loading="orderBookLoading"
        :order-book-has-more="orderBookHasMore"
        :maker-assets="makerAssets"
        :taker-assets="takerAssets"
        :price-adjustment="priceAdjustment"
        :displayed-trades="displayedTrades"
        :loading="loading"
        :has-more="hasMore"
        :shared-filters="sharedFilters"
        :shared-search-value="sharedSearchValue"
        :shared-filtered-suggestions="sharedFilteredSuggestions"
        @update:active-trading-view="activeTradingView = $event"
        @update:active-view="activeView = $event"
        @load-order-book-data="loadOrderBookData"
        @load-data="loadData"
        @submit="handleOfferSubmitWithView"
        @fill-from-order-book="fillFromOrderBook"
        @use-as-template="useAsTemplate"
      />
    </div>

    <!-- Sticky Filter Panel -->
    <StickyFilterPanel
      v-show="showFilterPane"
      ref="stickyFilterPanelRef"
      :has-active-filters="hasActiveSharedFilters"
      :shared-filters="sharedFilters"
      @remove-shared-filter="globalFilterStore.removeFilter"
      @clear-all-shared-filters="globalFilterStore.clearAllFilters"
    />
  </div>
</template>

<script setup lang="ts">
  import type { OfferSubmitData, SuggestionItem } from '@/pages/Trading/types'
  import { useOfferSubmission } from '@/shared/composables/useOfferSubmission'
  import { useOrderBookData } from '@/shared/composables/useOrderBookData'
  import { useOrderHistoryData } from '@/shared/composables/useOrderHistoryData'
  import { globalFilterStore } from '@/shared/stores/globalFilterStore'
  import { onMounted, ref, watch } from 'vue'
  import StickyFilterPanel from './components/StickyFilterPanel.vue'
  import TradingLayout from './components/TradingLayout.vue'

  // Use global filter store
  const sharedSearchValue = globalFilterStore.searchValue
  const sharedFilteredSuggestions = globalFilterStore.filteredSuggestions
  const sharedFilters = globalFilterStore.filters
  const hasActiveSharedFilters = globalFilterStore.hasActiveFilters
  const showFilterPane = globalFilterStore.showFilterPane

  const { orderBookData, orderBookLoading, orderBookHasMore, loadOrderBookData } =
    useOrderBookData()

  const { displayedTrades, loading, hasMore, loadData } = useOrderHistoryData()

  const {
    priceAdjustment,
    makerAssets,
    takerAssets,
    fillFromOrderBook,
    useAsTemplate,
    handleOfferSubmit,
  } = useOfferSubmission()

  // State
  const activeView = ref<'create' | 'take' | 'history'>('create')
  const activeTradingView = ref<'orderbook' | 'chart' | 'depth' | 'trades'>('orderbook')
  const stickyFilterPanelRef = ref()

  // Enhanced search handler that includes data
  const handleSharedSearchChange = () => {
    // Generate suggestions from both order book and order history data
    const suggestions: SuggestionItem[] = []
    const lowerSearch = sharedSearchValue.value.toLowerCase()

    // Get unique assets from order book data
    const orderBookAssets = new Set<string>()
    orderBookData.value.forEach(order => {
      order.offering.forEach(asset => {
        // Add asset logic here
        orderBookAssets.add(asset.id)
      })
      order.receiving.forEach(asset => {
        orderBookAssets.add(asset.id)
      })
    })

    // Get unique assets from order history data
    const orderHistoryAssets = new Set<string>()
    displayedTrades.value.forEach(trade => {
      trade.sellAssets.forEach(asset => {
        orderHistoryAssets.add(asset.id)
      })
      trade.buyAssets.forEach(asset => {
        orderHistoryAssets.add(asset.id)
      })
    })

    // Combine all unique assets
    const allAssets = new Set([...orderBookAssets, ...orderHistoryAssets])

    // Generate suggestions
    allAssets.forEach(assetId => {
      if (assetId.toLowerCase().includes(lowerSearch)) {
        if (
          !sharedFilters.value.buyAsset.some(
            filter => filter.toLowerCase() === assetId.toLowerCase()
          )
        ) {
          suggestions.push({
            value: assetId,
            column: 'buyAsset',
            label: `Buy ${assetId}`,
          })
        }
        if (
          !sharedFilters.value.sellAsset.some(
            filter => filter.toLowerCase() === assetId.toLowerCase()
          )
        ) {
          suggestions.push({
            value: assetId,
            column: 'sellAsset',
            label: `Sell ${assetId}`,
          })
        }
      }
    })

    // Add status suggestions
    const statusOptions = ['Open', 'Filled', 'Cancelled', 'Partial']
    statusOptions.forEach(status => {
      if (
        status.toLowerCase().includes(lowerSearch) &&
        !(sharedFilters.value.status?.includes(status) ?? false)
      ) {
        suggestions.push({
          value: status,
          column: 'status',
          label: `Status: ${status}`,
        })
      }
    })

    globalFilterStore.setFilteredSuggestions(suggestions)
  }

  // Enhanced offer submit handler
  const handleOfferSubmitWithView = async (data: OfferSubmitData) => {
    await handleOfferSubmit(data, activeView.value)
  }

  // Lifecycle
  onMounted(() => {
    // Load order book data if it's empty
    if (orderBookData.value.length === 0) {
      loadOrderBookData()
    }

    // Listen for global filter events
    window.addEventListener('global-search-change', (_event: CustomEvent) => {
      handleSharedSearchChange()
    })

    window.addEventListener('global-filter-added', (_event: CustomEvent) => {
      handleSharedSearchChange()
    })

    window.addEventListener('global-assets-swapped', () => {
      handleSharedSearchChange()
    })

    window.addEventListener('global-filter-pane-toggle', (event: CustomEvent) => {
      globalFilterStore.setShowFilterPane(event.detail.show)
    })
  })

  // Watchers
  watch(activeView, newView => {
    if (newView === 'history' && displayedTrades.value.length === 0) {
      loadData()
    } else if ((newView === 'create' || newView === 'take') && orderBookData.value.length === 0) {
      loadOrderBookData()
    }
  })
</script>

<style scoped>
  .content-page {
    @apply h-screen bg-gray-50 dark:bg-gray-900 px-0 sm:px-1 lg:px-1 py-0 flex flex-col;
  }

  .content-body {
    @apply flex-1 flex flex-col;
  }

  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
  }

  /* Dark mode for PrimeVue components */
  :deep(.p-dropdown) {
    @apply bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600;
  }

  :deep(.p-dropdown-panel) {
    @apply bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600;
  }

  :deep(.p-dropdown-item) {
    @apply text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600;
  }

  :deep(.p-inputnumber) {
    @apply bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600;
  }

  :deep(.p-inputnumber-input) {
    @apply bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100;
  }

  :deep(.p-inputnumber-input:focus) {
    @apply border-primary-500 dark:border-primary-400 ring-primary-500 dark:ring-primary-400;
  }

  :deep(.p-slider) {
    @apply bg-gray-200 dark:bg-gray-600;
  }

  :deep(.p-slider-range) {
    @apply bg-primary-500 dark:bg-primary-400;
  }

  :deep(.p-slider-handle) {
    @apply bg-primary-500 dark:bg-primary-400 border-primary-500 dark:border-primary-400;
  }

  :deep(.p-button) {
    @apply text-gray-900 dark:text-gray-100;
  }

  :deep(.p-button.p-button-secondary) {
    @apply bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300;
  }

  :deep(.p-button.p-button-secondary:hover) {
    @apply bg-gray-200 dark:bg-gray-600;
  }

  :deep(.p-button.p-button-danger) {
    @apply bg-red-500 dark:bg-red-600 border-red-500 dark:border-red-600;
  }

  :deep(.p-button.p-button-danger:hover) {
    @apply bg-red-600 dark:bg-red-700;
  }
</style>
