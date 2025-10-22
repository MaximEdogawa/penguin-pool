<template>
  <div class="content-page">
    <div class="content-header">
      <div class="flex gap-2 mb-2 border-b border-gray-200 dark:border-gray-700">
        <button
          @click="activeView = 'trade'"
          :class="[
            'px-6 py-3 font-medium transition-colors',
            activeView === 'trade'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300',
          ]"
        >
          Trade
        </button>
        <button
          @click="activeView = 'history'"
          :class="[
            'px-6 py-3 font-medium transition-colors',
            activeView === 'history'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300',
          ]"
        >
          Order History
        </button>
      </div>
    </div>
    <div class="content-body">
      <!-- Trading View -->
      <div v-if="activeView === 'trade'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Order Book Sidebar -->
        <div class="lg:col-span-1">
          <OrderBook
            :order-book-data="orderBookData"
            :loading="orderBookLoading"
            :has-more="orderBookHasMore"
            :filters="orderBookFilters"
            :search-value="orderBookSearchValue"
            :filtered-suggestions="orderBookFilteredSuggestions"
            @load-more="loadOrderBookData"
            @update-filters="updateOrderBookFilters"
            @update-search="updateOrderBookSearch"
            @add-filter="addOrderBookFilter"
            @remove-filter="removeOrderBookFilter"
            @clear-filters="clearOrderBookFilters"
            @fill-from-order-book="fillFromOrderBook"
            @use-as-template="useAsTemplate"
          />
        </div>

        <!-- Trading Interface -->
        <div class="lg:col-span-1">
          <!-- Maker/Taker Tabs -->
          <div class="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              @click="activeTab = 'maker'"
              :class="[
                'px-6 py-3 font-medium transition-colors',
                activeTab === 'maker'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300',
              ]"
            >
              Create Offer
            </button>
            <button
              @click="activeTab = 'taker'"
              :class="[
                'px-6 py-3 font-medium transition-colors',
                activeTab === 'taker'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300',
              ]"
            >
              Take Offer
            </button>
          </div>

          <!-- Create Offer Component -->
          <CreateOffer
            :mode="activeTab"
            :initial-offering-assets="makerAssets"
            :initial-requested-assets="takerAssets"
            :initial-price-adjustment="priceAdjustment"
            @submit="handleOfferSubmit"
          />
        </div>
      </div>

      <!-- Order History View -->
      <div v-if="activeView === 'history'">
        <OrderHistory
          :trades="displayedTrades"
          :loading="loading"
          :has-more="hasMore"
          :filters="filters"
          :search-value="searchValue"
          :filtered-suggestions="filteredSuggestions"
          @load-more="loadData"
          @update-filters="updateFilters"
          @update-search="updateSearch"
          @add-filter="addFilter"
          @remove-filter="removeFilter"
          @clear-filters="clearFilters"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import CreateOffer from '@/components/Offers/CreateOffer.vue'
  import { useWalletDataService } from '@/features/walletConnect/services/WalletDataService'
  import { useOfferStorage } from '@/shared/composables/useOfferStorage'
  import type { DexieOffer } from '@/shared/services/DexieDataService'
  import { useDexieDataService } from '@/shared/services/DexieDataService'
  import { logger } from '@/shared/services/logger'
  import { xchToMojos } from '@/shared/utils/chia-units'
  import type { OfferDetails } from '@/types/offer.types'
  import { onMounted, reactive, ref, watch } from 'vue'
  import OrderBook from './components/OrderBook.vue'
  import OrderHistory from './components/OrderHistory.vue'

  // Interfaces
  interface AssetItem {
    assetId: string
    amount: number
    type: 'xch' | 'cat' | 'nft'
    symbol: string
    searchQuery: string
    showDropdown: boolean
  }

  interface DexieAssetItem {
    id: string
    code: string
    name: string
    amount: number
  }

  interface OrderBookOrder {
    id: string
    offering: DexieAssetItem[]
    receiving: DexieAssetItem[]
    maker: string
    timestamp: string
    offeringUsdValue: number
    receivingUsdValue: number
    pricePerUnit: number
    status: number
    date_found: string
    date_completed?: string | null
    date_pending?: string | null
    date_expiry?: string | null
    known_taker?: unknown | null
    offerString?: string
    creatorAddress?: string
  }

  interface Trade {
    id: string
    sellAssets: DexieAssetItem[]
    buyAssets: DexieAssetItem[]
    status: string
    maker: string
    timestamp: string
    date_found: string
    date_completed?: string | null
    date_pending?: string | null
    date_expiry?: string | null
    known_taker?: unknown | null
  }

  interface FilterState {
    buyAsset: string[]
    sellAsset: string[]
    status?: string[]
    [key: string]: string[] | undefined
  }

  interface SuggestionItem {
    value: string
    column: string
    label: string
  }

  // Services
  const walletDataService = useWalletDataService()
  const offerStorage = useOfferStorage()
  const dexieDataService = useDexieDataService()

  // State
  const activeView = ref<'trade' | 'history'>('trade')
  const activeTab = ref<'maker' | 'taker'>('maker')
  const priceAdjustment = ref(0)

  // Asset management
  const makerAssets = ref<AssetItem[]>([
    { assetId: '', amount: 0, type: 'xch', symbol: '', searchQuery: '', showDropdown: false },
  ])
  const takerAssets = ref<AssetItem[]>([
    { assetId: '', amount: 0, type: 'xch', symbol: '', searchQuery: '', showDropdown: false },
  ])

  // Order book data
  const orderBookData = ref<OrderBookOrder[]>([])
  const orderBookLoading = ref(false)
  const orderBookHasMore = ref(true)
  const selectedOrderForTaking = ref<OrderBookOrder | null>(null)
  const fetchedOfferString = ref<string>('')
  const orderBookPage = ref(0)
  const orderBookSearchValue = ref('')
  const orderBookFilteredSuggestions = ref<SuggestionItem[]>([])
  const orderBookFilters = reactive<FilterState>({
    buyAsset: [],
    sellAsset: [],
  })

  // Order history data
  const displayedTrades = ref<Trade[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const page = ref(0)
  const searchValue = ref('')
  const filteredSuggestions = ref<SuggestionItem[]>([])
  const filters = reactive<FilterState>({
    buyAsset: [],
    sellAsset: [],
    status: [],
  })

  // Constants
  const rowsPerPage = 20

  // Mock USD prices for assets (in a real app, this would come from an API)
  const usdPrices: Record<string, number> = {
    XCH: 30,
    BTC: 122013,
    ETH: 3500,
    USDT: 1,
    USDC: 1,
    SOL: 120,
    MATIC: 0.85,
    AVAX: 35,
    LINK: 15,
  }

  // Methods

  const fillFromOrderBook = async (order: OrderBookOrder) => {
    // Store the selected order for taking
    selectedOrderForTaking.value = order

    // Fetch the offer string using the order ID
    try {
      const response = await dexieDataService.inspectOffer(order.id)
      if (response.success && response.offer?.offer) {
        fetchedOfferString.value = response.offer.offer
      } else {
        fetchedOfferString.value = ''
        logger.warn('Could not fetch offer string for order:', order.id)
      }
    } catch (error) {
      logger.error('Failed to fetch offer string:', error)
      fetchedOfferString.value = ''
    }

    // Don't change tab - keep current mode
    // Convert order data to the format expected by the component
    makerAssets.value = order.offering.map(asset => ({
      assetId: asset.id,
      amount: asset.amount,
      type: asset.id === '' ? 'xch' : 'cat',
      symbol: asset.code || '',
      searchQuery: asset.code || '', // Pre-fill search with ticker symbol
      showDropdown: false,
    }))

    takerAssets.value = order.receiving.map(asset => ({
      assetId: asset.id,
      amount: asset.amount,
      type: asset.id === '' ? 'xch' : 'cat',
      symbol: asset.code || '',
      searchQuery: asset.code || '', // Pre-fill search with ticker symbol
      showDropdown: false,
    }))
  }

  const useAsTemplate = (order: OrderBookOrder) => {
    if (activeTab.value === 'maker') {
      makerAssets.value = order.offering.map(asset => ({
        assetId: asset.id,
        amount: asset.amount,
        type: asset.id === '' ? 'xch' : 'cat',
        symbol: asset.code || '',
        searchQuery: asset.code || '', // Pre-fill search with ticker symbol
        showDropdown: false,
      }))
      takerAssets.value = order.receiving.map(asset => ({
        assetId: asset.id,
        amount: asset.amount,
        type: asset.id === '' ? 'xch' : 'cat',
        symbol: asset.code || '',
        searchQuery: asset.code || '', // Pre-fill search with ticker symbol
        showDropdown: false,
      }))
    }
  }

  const handleOfferSubmit = async (data: {
    offeringAssets: Array<{ assetId: string; amount: number; type: string; symbol: string }>
    requestedAssets: Array<{ assetId: string; amount: number; type: string; symbol: string }>
    priceAdjustment: number
    mode: 'maker' | 'taker'
  }) => {
    try {
      // Helper function to convert amounts to the smallest unit based on asset type
      const convertToSmallestUnit = (amount: number, assetType: string): number => {
        switch (assetType) {
          case 'xch':
            return xchToMojos(amount) // XCH to mojos using shared utility
          case 'cat':
            // CAT tokens might need conversion to smallest unit
            return Math.round(amount * 1000)
          case 'nft':
            return Math.floor(amount) // NFTs are whole numbers
          default:
            return amount // Default to exact amount for unknown tokens
        }
      }

      // Convert assets to the format expected by the wallet
      const offerAssets = data.offeringAssets
        .filter(asset => asset.amount > 0)
        .map(asset => ({
          assetId: asset.type === 'xch' ? '' : asset.assetId,
          amount: convertToSmallestUnit(asset.amount, asset.type),
          type: asset.type,
        }))

      const requestAssets = data.requestedAssets
        .filter(asset => asset.amount > 0)
        .map(asset => ({
          assetId: asset.type === 'xch' ? '' : asset.assetId,
          amount: convertToSmallestUnit(asset.amount, asset.type),
          type: asset.type,
        }))

      if (data.mode === 'maker') {
        // Create maker offer - use same logic as CreateOfferModal
        const result = await walletDataService.createOffer({
          walletId: 1,
          offerAssets,
          requestAssets,
          fee: xchToMojos(0.000001), // Use same fee conversion as CreateOfferModal
        })

        if (!result || !result.offer) {
          throw new Error('Wallet did not return a valid offer string')
        }

        const newOffer: OfferDetails = {
          id: result?.id || Date.now().toString(),
          tradeId: result?.tradeId || result?.id || 'unknown',
          offerString: result?.offer || '',
          status: 'active',
          createdAt: new Date(),
          assetsOffered: data.offeringAssets.map(asset => ({
            assetId: asset.type === 'xch' ? '' : asset.assetId,
            amount: asset.amount || 0,
            type: asset.type as 'xch' | 'cat' | 'nft',
            symbol: asset.symbol || '',
          })),
          assetsRequested: data.requestedAssets.map(asset => ({
            assetId: asset.type === 'xch' ? '' : asset.assetId,
            amount: asset.amount || 0,
            type: asset.type as 'xch' | 'cat' | 'nft',
            symbol: asset.symbol || '',
          })),
          fee: 0.000001,
          creatorAddress: walletDataService.address.data.value?.address || 'unknown',
        }

        await offerStorage.saveOffer(newOffer, true)
        // Reset form
        makerAssets.value = [
          {
            assetId: '',
            amount: 0,
            type: 'xch',
            symbol: '',
            searchQuery: '',
            showDropdown: false,
          },
        ]
        takerAssets.value = [
          {
            assetId: '',
            amount: 0,
            type: 'xch',
            symbol: '',
            searchQuery: '',
            showDropdown: false,
          },
        ]
        priceAdjustment.value = 0
      } else {
        // Take existing offer - use the fetched offer string
        if (!fetchedOfferString.value || fetchedOfferString.value.trim() === '') {
          throw new Error(
            'No offer string available. Please select an order from the order book first.'
          )
        }

        const result = await walletDataService.takeOffer({
          offer: fetchedOfferString.value.trim(),
          fee: 0.000001, // Use same fee as TakeOfferModal
        })

        if (result?.success && result?.tradeId) {
          const takenOffer: OfferDetails = {
            id: Date.now().toString(),
            tradeId: result.tradeId,
            offerString: fetchedOfferString.value.trim(),
            status: 'pending',
            createdAt: new Date(),
            assetsOffered: data.offeringAssets.map(asset => ({
              assetId: asset.type === 'xch' ? '' : asset.assetId,
              amount: asset.amount || 0,
              type: asset.type as 'xch' | 'cat' | 'nft',
              symbol: asset.symbol || '',
            })),
            assetsRequested: data.requestedAssets.map(asset => ({
              assetId: asset.type === 'xch' ? '' : asset.assetId,
              amount: asset.amount || 0,
              type: asset.type as 'xch' | 'cat' | 'nft',
              symbol: asset.symbol || '',
            })),
            fee: 0.000001,
            creatorAddress: selectedOrderForTaking.value?.creatorAddress || 'unknown',
          }

          await offerStorage.saveOffer(takenOffer, true)
          // Reset form
          makerAssets.value = [
            {
              assetId: '',
              amount: 0,
              type: 'xch',
              symbol: '',
              searchQuery: '',
              showDropdown: false,
            },
          ]
          takerAssets.value = [
            {
              assetId: '',
              amount: 0,
              type: 'xch',
              symbol: '',
              searchQuery: '',
              showDropdown: false,
            },
          ]
          priceAdjustment.value = 0
          selectedOrderForTaking.value = null
          fetchedOfferString.value = ''
        } else {
          throw new Error('Failed to take offer')
        }
      }
    } catch (error) {
      // Handle error appropriately - could emit an event or show a toast notification
      void error // Suppress unused variable warning
    }
  }

  // Order book methods
  const loadOrderBookData = async () => {
    if (orderBookLoading.value || !orderBookHasMore.value) return

    orderBookLoading.value = true
    try {
      const response = await dexieDataService.searchOffers({
        page: orderBookPage.value,
        page_size: rowsPerPage,
        status: 0, // Only open offers
      })

      if (response.success && Array.isArray(response.data)) {
        const newOrders = (response.data as DexieOffer[])
          .filter((offer: DexieOffer) => offer && offer.offered && offer.requested) // Filter out invalid offers
          .map(convertDexieOfferToOrderBookOrder)
        orderBookData.value.push(...newOrders)
        orderBookPage.value++

        // Check if we have more data
        if (newOrders.length < rowsPerPage) {
          orderBookHasMore.value = false
        }
      }
    } catch (error) {
      // Handle error appropriately - could emit an event or show a toast notification
      void error // Suppress unused variable warning
    } finally {
      orderBookLoading.value = false
    }
  }

  const updateOrderBookFilters = (newFilters: Partial<FilterState>) => {
    Object.assign(orderBookFilters, newFilters)
  }

  const updateOrderBookSearch = (value: string) => {
    orderBookSearchValue.value = value
  }

  const addOrderBookFilter = (column: string, value: string) => {
    if (orderBookFilters[column] && !orderBookFilters[column]!.includes(value)) {
      orderBookFilters[column]!.push(value)
    }
  }

  const removeOrderBookFilter = (column: string, value: string) => {
    if (orderBookFilters[column]) {
      const index = orderBookFilters[column]!.indexOf(value)
      if (index > -1) {
        orderBookFilters[column]!.splice(index, 1)
      }
    }
  }

  const clearOrderBookFilters = (column: string) => {
    if (orderBookFilters[column]) {
      orderBookFilters[column] = []
    }
  }

  // Order history methods
  const loadData = async () => {
    if (loading.value || !hasMore.value) return

    loading.value = true
    try {
      const response = await dexieDataService.searchOffers({
        page: page.value,
        page_size: rowsPerPage,
        // No status filter to get all offers for history
      })

      if (response.success && Array.isArray(response.data)) {
        const newTrades = (response.data as DexieOffer[])
          .filter((offer: DexieOffer) => offer && offer.offered && offer.requested) // Filter out invalid offers
          .map(convertDexieOfferToTrade)
        displayedTrades.value.push(...newTrades)
        page.value++

        // Check if we have more data
        if (newTrades.length < rowsPerPage) {
          hasMore.value = false
        }
      }
    } catch (error) {
      // Handle error appropriately - could emit an event or show a toast notification
      void error // Suppress unused variable warning
    } finally {
      loading.value = false
    }
  }

  const updateFilters = (newFilters: Partial<FilterState>) => {
    Object.assign(filters, newFilters)
  }

  const updateSearch = (value: string) => {
    searchValue.value = value
  }

  const addFilter = (column: string, value: string) => {
    if (filters[column] && !filters[column]!.includes(value)) {
      filters[column]!.push(value)
    }
  }

  const removeFilter = (column: string, value: string) => {
    if (filters[column]) {
      const index = filters[column]!.indexOf(value)
      if (index > -1) {
        filters[column]!.splice(index, 1)
      }
    }
  }

  const clearFilters = (column: string) => {
    filters[column] = []
  }

  // Helper function to convert Dexie offer to OrderBookOrder format
  const convertDexieOfferToOrderBookOrder = (dexieOffer: DexieOffer): OrderBookOrder => {
    // Ensure amounts are numbers and handle undefined/null values
    const safeOffered = dexieOffer.offered.map(item => ({
      ...item,
      amount: typeof item.amount === 'number' ? item.amount : 0,
    }))
    const safeRequested = dexieOffer.requested.map(item => ({
      ...item,
      amount: typeof item.amount === 'number' ? item.amount : 0,
    }))

    const offeringUsdValue = safeOffered.reduce(
      (sum: number, item: DexieAssetItem) => sum + item.amount * (usdPrices[item.code] || 0),
      0
    )
    const receivingUsdValue = safeRequested.reduce(
      (sum: number, item: DexieAssetItem) => sum + item.amount * (usdPrices[item.code] || 0),
      0
    )

    return {
      id: dexieOffer.id,
      offering: safeOffered,
      receiving: safeRequested,
      maker: `0x${dexieOffer.id.substring(0, 8)}...${dexieOffer.id.substring(-8)}`,
      timestamp: new Date(dexieOffer.date_found).toLocaleTimeString(),
      offeringUsdValue,
      receivingUsdValue,
      pricePerUnit: receivingUsdValue / offeringUsdValue,
      status: dexieOffer.status,
      date_found: dexieOffer.date_found,
      date_completed: dexieOffer.date_completed,
      date_pending: dexieOffer.date_pending,
      date_expiry: dexieOffer.date_expiry,
      known_taker: dexieOffer.known_taker,
    }
  }

  // Helper function to convert Dexie offer to Trade format
  const convertDexieOfferToTrade = (dexieOffer: DexieOffer): Trade => {
    // Ensure amounts are numbers and handle undefined/null values
    const safeOffered = dexieOffer.offered.map(item => ({
      ...item,
      amount: typeof item.amount === 'number' ? item.amount : 0,
    }))
    const safeRequested = dexieOffer.requested.map(item => ({
      ...item,
      amount: typeof item.amount === 'number' ? item.amount : 0,
    }))

    return {
      id: dexieOffer.id,
      sellAssets: safeOffered,
      buyAssets: safeRequested,
      status: calculateOfferState(dexieOffer),
      maker: `0x${dexieOffer.id.substring(0, 8)}...${dexieOffer.id.substring(-8)}`,
      timestamp: new Date(dexieOffer.date_found).toLocaleString(),
      date_found: dexieOffer.date_found,
      date_completed: dexieOffer.date_completed,
      date_pending: dexieOffer.date_pending,
      date_expiry: dexieOffer.date_expiry,
      known_taker: dexieOffer.known_taker,
    }
  }

  // Helper function to calculate offer state
  const calculateOfferState = (offer: DexieOffer): string => {
    const dateFound = offer.date_found ? new Date(offer.date_found) : null
    const dateCompleted = offer.date_completed ? new Date(offer.date_completed) : null
    const datePending = offer.date_pending ? new Date(offer.date_pending) : null
    const dateExpiry = offer.date_expiry ? new Date(offer.date_expiry) : null
    const knownTaker = offer.known_taker

    if (dateCompleted && knownTaker !== null && knownTaker !== undefined) return 'Completed'
    if (offer.spent_block_index !== null && offer.spent_block_index !== undefined)
      return 'Cancelled'
    if (datePending && !dateFound) return 'Pending'
    if (dateExpiry && dateFound && dateExpiry < dateFound) return 'Expired'
    if (offer.block_expiry !== null && offer.block_expiry !== undefined) return 'Expired'
    if (dateFound && !dateCompleted) {
      const isWithinExpiry = !dateExpiry || dateFound < dateExpiry
      if (isWithinExpiry) return 'Open'
    }

    return 'Unknown'
  }

  // Mock data generators removed - using real data from Dexie API

  // Lifecycle
  onMounted(() => {
    if (activeView.value === 'trade' && orderBookData.value.length === 0) {
      loadOrderBookData()
    }
  })

  // Watchers
  watch(activeView, newView => {
    if (newView === 'history' && displayedTrades.value.length === 0) {
      loadData()
    } else if (newView === 'trade' && orderBookData.value.length === 0) {
      loadOrderBookData()
    }
  })
</script>

<style scoped>
  .content-page {
    @apply min-h-screen bg-gray-50 dark:bg-gray-900 p-2 sm:p-4 lg:p-6;
  }

  .content-header {
    @apply mb-2;
  }

  .content-body {
    @apply space-y-4;
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
