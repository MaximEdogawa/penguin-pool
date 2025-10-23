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
      @remove-shared-filter="removeSharedFilter"
      @clear-all-shared-filters="clearAllSharedFilters"
    />
  </div>
</template>

<script setup lang="ts">
  import type { OfferSubmitData } from '@/pages/Trading/types'
  import { useOfferSubmission } from '@/shared/composables/useOfferSubmission'
  import { useOrderBookData } from '@/shared/composables/useOrderBookData'
  import { useOrderHistoryData } from '@/shared/composables/useOrderHistoryData'
  import { useTradingFilters } from '@/shared/composables/useTradingFilters'
  import { onMounted, ref, watch } from 'vue'
  import StickyFilterPanel from './components/StickyFilterPanel.vue'
  import TradingLayout from './components/TradingLayout.vue'

  // Use composables
  const {
    sharedSearchValue,
    sharedFilteredSuggestions,
    sharedFilters,
    hasActiveSharedFilters,
    assetsSwapped,
    handleSharedSearchChange: handleSharedSearchChangeBase,
    addSharedFilter,
    removeSharedFilter,
    clearAllSharedFilters,
    swapBuySellAssets,
    loadFilterState,
    setDefaultFilter,
  } = useTradingFilters()

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
  const showFilterPane = ref(false)
  const stickyFilterPanelRef = ref()

  // Enhanced search handler that includes data
  const handleSharedSearchChange = () => {
    handleSharedSearchChangeBase(orderBookData.value, displayedTrades.value)
    // Update AppTopbar with current state
    updateAppTopbarState()
  }

  // Enhanced offer submit handler
  const handleOfferSubmitWithView = async (data: OfferSubmitData) => {
    await handleOfferSubmit(data, activeView.value)
  }

  // AppTopbar communication methods
  const updateAppTopbarState = () => {
    window.dispatchEvent(
      new CustomEvent('trading-filters-updated', {
        detail: {
          filters: sharedFilters,
          suggestions: sharedFilteredSuggestions.value,
          searchValue: sharedSearchValue.value,
          assetsSwapped: assetsSwapped.value,
        },
      })
    )
  }

  // Lifecycle
  onMounted(() => {
    // Load saved filter state from localStorage
    loadFilterState()

    // Set default filter if no filters are applied
    if (!hasActiveSharedFilters.value) {
      setDefaultFilter()
    }

    // Load order book data if it's empty
    if (orderBookData.value.length === 0) {
      loadOrderBookData()
    }

    // Listen for AppTopbar events
    window.addEventListener('trading-search-change', (event: CustomEvent) => {
      sharedSearchValue.value = event.detail.value
      handleSharedSearchChange()
    })

    window.addEventListener('trading-filter-added', (event: CustomEvent) => {
      const { column, value } = event.detail
      addSharedFilter(column, value)
      updateAppTopbarState()
    })

    window.addEventListener('trading-assets-swapped', () => {
      swapBuySellAssets()
      updateAppTopbarState()
    })

    window.addEventListener('trading-filter-pane-toggle', (event: CustomEvent) => {
      showFilterPane.value = event.detail.show
    })

    // Initial state update
    updateAppTopbarState()
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
    @apply min-h-screen bg-gray-50 dark:bg-gray-900 px-0 sm:px-1 lg:px-1 py-0;
  }

  .content-body {
    @apply space-y-2;
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
