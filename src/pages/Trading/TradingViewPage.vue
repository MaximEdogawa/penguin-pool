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
  import { useToast } from 'primevue/usetoast'
  import { onMounted, ref, watch } from 'vue'
  import StickyFilterPanel from './components/StickyFilterPanel.vue'
  import TradingLayout from './components/TradingLayout.vue'

  // Use global filter store
  const sharedSearchValue = globalFilterStore.searchValue
  const sharedFilteredSuggestions = globalFilterStore.filteredSuggestions
  const sharedFilters = globalFilterStore.filters
  const hasActiveSharedFilters = globalFilterStore.hasActiveFilters
  const showFilterPane = globalFilterStore.showFilterPane

  // Toast service
  const toast = useToast()

  const {
    orderBookData,
    orderBookLoading,
    orderBookHasMore,
    loadOrderBookData,
    refreshOrderBookData,
    startRefreshInterval,
  } = useOrderBookData(toast)

  const { displayedTrades, loading, hasMore, loadData } = useOrderHistoryData()

  const {
    priceAdjustment,
    makerAssets,
    takerAssets,
    fillFromOrderBook,
    useAsTemplate,
    handleOfferSubmit,
    uploadOfferToDexie,
  } = useOfferSubmission()

  // State
  const activeView = ref<'create' | 'take' | 'history'>('take')
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
    const result = await handleOfferSubmit(data, activeView.value)

    // Handle successful offer creation
    if (result?.success && result?.offerString) {
      try {
        // Show uploading toast with beautiful styling
        toast.add({
          severity: 'info',
          summary: '🚀 Uploading Offer',
          detail:
            'Your offer is being uploaded to Dexie for public trading. This may take a few moments...',
          life: 10000,
          closable: true,
          group: 'offer-upload',
        })

        // Upload to Dexie
        const uploadResult = await uploadOfferToDexie(result.offerString)

        // Show success toast with enhanced styling
        toast.add({
          severity: 'success',
          summary: '✅ Offer Uploaded Successfully!',
          detail: `Your offer is now live on Dexie! Other traders can now see and take your offer. Dexie ID: ${uploadResult.dexieId}`,
          life: 15000,
          closable: true,
          group: 'offer-upload',
        })

        // Refresh order book to show the new offer
        await refreshOrderBookData()

        // Show order book refresh toast
        toast.add({
          severity: 'info',
          summary: '📊 Order Book Updated',
          detail:
            'The order book has been refreshed to show your new offer and latest market data.',
          life: 8000,
          closable: true,
          group: 'order-book',
        })
      } catch (error) {
        // Show error toast with enhanced styling
        toast.add({
          severity: 'error',
          summary: '❌ Upload Failed',
          detail: `Failed to upload your offer to Dexie. ${error instanceof Error ? error.message : 'Please try again later.'}`,
          life: 20000,
          closable: true,
          group: 'offer-upload',
        })
      }
    } else if (result?.success === false) {
      // Handle offer creation failure
      toast.add({
        severity: 'error',
        summary: '❌ Offer Creation Failed',
        detail: result.error || 'Failed to create offer. Please try again.',
        life: 15000,
        closable: true,
        group: 'offer-creation',
      })
    }
  }

  // Lifecycle
  onMounted(() => {
    // Load order book data if it's empty
    if (orderBookData.value.length === 0) {
      loadOrderBookData()
    }

    // Start the refresh interval
    startRefreshInterval()

    // Listen for global filter events
    window.addEventListener('global-search-change', (_event: Event) => {
      handleSharedSearchChange()
    })

    window.addEventListener('global-filter-added', (_event: Event) => {
      handleSharedSearchChange()
    })

    window.addEventListener('global-assets-swapped', () => {
      handleSharedSearchChange()
    })

    window.addEventListener('global-filter-pane-toggle', (event: Event) => {
      const customEvent = event as CustomEvent
      globalFilterStore.setShowFilterPane(customEvent.detail.show)
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

  /* Enhanced Toast Styling */
  :deep(.p-toast) {
    @apply z-50;
  }

  :deep(.p-toast .p-toast-message) {
    @apply shadow-2xl border-0 rounded-xl transform transition-all duration-300 ease-in-out;
    min-width: 400px;
    max-width: 500px;
  }

  :deep(.p-toast .p-toast-message.p-toast-message-success) {
    @apply bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-l-4 border-green-500;
    box-shadow:
      0 10px 25px -5px rgba(34, 197, 94, 0.3),
      0 10px 10px -5px rgba(34, 197, 94, 0.1);
  }

  :deep(.p-toast .p-toast-message.p-toast-message-error) {
    @apply bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-l-4 border-red-500;
    box-shadow:
      0 10px 25px -5px rgba(239, 68, 68, 0.3),
      0 10px 10px -5px rgba(239, 68, 68, 0.1);
  }

  :deep(.p-toast .p-toast-message.p-toast-message-info) {
    @apply bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-l-4 border-blue-500;
    box-shadow:
      0 10px 25px -5px rgba(59, 130, 246, 0.3),
      0 10px 10px -5px rgba(59, 130, 246, 0.1);
  }

  :deep(.p-toast .p-toast-message.p-toast-message-warn) {
    @apply bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-l-4 border-yellow-500;
    box-shadow:
      0 10px 25px -5px rgba(245, 158, 11, 0.3),
      0 10px 10px -5px rgba(245, 158, 11, 0.1);
  }

  :deep(.p-toast .p-toast-message-content) {
    @apply p-6;
  }

  :deep(.p-toast .p-toast-summary) {
    @apply font-bold text-gray-900 dark:text-gray-100 text-lg mb-2;
  }

  :deep(.p-toast .p-toast-detail) {
    @apply text-gray-700 dark:text-gray-300 text-base leading-relaxed;
  }

  :deep(.p-toast .p-toast-icon-close) {
    @apply text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200;
  }

  /* Toast entrance animation */
  :deep(.p-toast .p-toast-message) {
    animation: slideInRight 0.5s ease-out;
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Toast hover effects */
  :deep(.p-toast .p-toast-message:hover) {
    @apply transform scale-105;
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.2);
  }

  /* Toast pulse animation for important messages */
  :deep(.p-toast .p-toast-message.p-toast-message-success) {
    animation:
      slideInRight 0.5s ease-out,
      pulseSuccess 2s ease-in-out infinite;
  }

  :deep(.p-toast .p-toast-message.p-toast-message-error) {
    animation:
      slideInRight 0.5s ease-out,
      pulseError 2s ease-in-out infinite;
  }

  @keyframes pulseSuccess {
    0%,
    100% {
      box-shadow:
        0 10px 25px -5px rgba(34, 197, 94, 0.3),
        0 10px 10px -5px rgba(34, 197, 94, 0.1);
    }
    50% {
      box-shadow:
        0 15px 35px -5px rgba(34, 197, 94, 0.5),
        0 15px 15px -5px rgba(34, 197, 94, 0.2);
    }
  }

  @keyframes pulseError {
    0%,
    100% {
      box-shadow:
        0 10px 25px -5px rgba(239, 68, 68, 0.3),
        0 10px 10px -5px rgba(239, 68, 68, 0.1);
    }
    50% {
      box-shadow:
        0 15px 35px -5px rgba(239, 68, 68, 0.5),
        0 15px 15px -5px rgba(239, 68, 68, 0.2);
    }
  }
</style>
