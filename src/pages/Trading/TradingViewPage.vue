<template>
  <div class="content-page">
    <div class="content-body">
      <!-- Shared Asset Search Filter -->
      <div class="mb-4">
        <div class="px-2 py-1">
          <div class="relative">
            <InputText
              v-model="sharedSearchValue"
              placeholder="Search by asset... (AND logic - all selected assets must match)"
              class="w-full text-sm"
              @input="handleSharedSearchChange"
            />
            <div
              v-if="sharedFilteredSuggestions.length > 0 && sharedSearchValue"
              class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              <div
                v-for="(suggestion, idx) in sharedFilteredSuggestions"
                :key="idx"
                @click="addSharedFilter(suggestion.column, suggestion.value)"
                class="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm flex items-center justify-between"
              >
                <span>{{ suggestion.label }}</span>
                <span
                  :class="[
                    'text-xs px-2 py-0.5 rounded-full',
                    suggestion.column === 'buyAsset'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : suggestion.column === 'sellAsset'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
                  ]"
                >
                  {{
                    suggestion.column === 'buyAsset'
                      ? 'Buy'
                      : suggestion.column === 'sellAsset'
                        ? 'Sell'
                        : 'Status'
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- Active Filters -->
          <div v-if="hasActiveSharedFilters" class="space-y-2 mt-2">
            <div
              v-for="(values, column) in sharedFilters"
              :key="column"
              v-show="values && values.length > 0"
              class="flex items-start gap-2"
            >
              <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
                {{
                  column === 'buyAsset'
                    ? 'Buy Assets:'
                    : column === 'sellAsset'
                      ? 'Sell Assets:'
                      : 'Status:'
                }}
              </div>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="value in values"
                  :key="value"
                  :class="[
                    'inline-flex items-center gap-1 px-2 py-1 rounded text-xs',
                    column === 'buyAsset'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : column === 'sellAsset'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
                  ]"
                >
                  {{ value }}
                  <button
                    @click="removeSharedFilter(column as keyof FilterState, value)"
                    class="hover:opacity-70 ml-1"
                  >
                    ×
                  </button>
                </span>
              </div>
            </div>
            <button
              @click="clearAllSharedFilters"
              class="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Main Layout: Order Book + Right Panel -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Order Book Sidebar - Always Visible -->
        <div class="lg:col-span-1">
          <OrderBook
            :order-book-data="orderBookData"
            :loading="orderBookLoading"
            :has-more="orderBookHasMore"
            :filters="sharedFilters"
            :search-value="sharedSearchValue"
            :filtered-suggestions="sharedFilteredSuggestions"
            @load-more="loadOrderBookData"
            @fill-from-order-book="fillFromOrderBook"
            @use-as-template="useAsTemplate"
          />
        </div>

        <!-- Right Panel with Single Tab Menu -->
        <div class="lg:col-span-1">
          <!-- Single Tab Menu -->
          <div class="flex gap-2 mb-2 border-b border-gray-200 dark:border-gray-700">
            <button
              @click="activeView = 'create'"
              :class="[
                'px-4 py-2 text-sm font-medium transition-colors',
                activeView === 'create'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300',
              ]"
            >
              Create Offer
            </button>
            <button
              @click="activeView = 'take'"
              :class="[
                'px-4 py-2 text-sm font-medium transition-colors',
                activeView === 'take'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300',
              ]"
            >
              Take Offer
            </button>
            <button
              @click="activeView = 'history'"
              :class="[
                'px-4 py-2 text-sm font-medium transition-colors',
                activeView === 'history'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300',
              ]"
            >
              Offer History
            </button>
          </div>

          <!-- Content based on active view -->
          <!-- Create Offer View -->
          <div v-if="activeView === 'create'">
            <CreateOffer
              mode="maker"
              :initial-offering-assets="makerAssets"
              :initial-requested-assets="takerAssets"
              :initial-price-adjustment="priceAdjustment"
              @submit="handleOfferSubmit"
            />
          </div>

          <!-- Take Offer View -->
          <div v-if="activeView === 'take'">
            <CreateOffer
              mode="taker"
              :initial-offering-assets="makerAssets"
              :initial-requested-assets="takerAssets"
              :initial-price-adjustment="priceAdjustment"
              @submit="handleOfferSubmit"
            />
          </div>

          <!-- Offer History View -->
          <div v-if="activeView === 'history'">
            <OrderHistory
              :trades="displayedTrades"
              :loading="loading"
              :has-more="hasMore"
              :filters="sharedFilters"
              :search-value="sharedSearchValue"
              :filtered-suggestions="sharedFilteredSuggestions"
              @load-more="loadData"
              @fill-from-order-book="fillFromOrderBook"
              @use-as-template="useAsTemplate"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import CreateOffer from '@/components/Offers/CreateOffer.vue'
  import { useWalletDataService } from '@/features/walletConnect/services/WalletDataService'
  import { useOfferStorage } from '@/shared/composables/useOfferStorage'
  import { useTickerMapping } from '@/shared/composables/useTickerMapping'
  import type { DexieOffer } from '@/shared/services/DexieDataService'
  import { useDexieDataService } from '@/shared/services/DexieDataService'
  import { logger } from '@/shared/services/logger'
  import { xchToMojos } from '@/shared/utils/chia-units'
  import type { OfferDetails } from '@/types/offer.types'
  import InputText from 'primevue/inputtext'
  import { computed, onMounted, reactive, ref, watch } from 'vue'
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
  const { getTickerSymbol } = useTickerMapping()

  // State
  const activeView = ref<'create' | 'take' | 'history'>('create')
  const activeTab = ref<'maker' | 'taker'>('maker')
  const priceAdjustment = ref(0)

  // Asset management
  const makerAssets = ref<AssetItem[]>([
    { assetId: '', amount: 0, type: 'xch', symbol: '', searchQuery: '', showDropdown: false },
  ])
  const takerAssets = ref<AssetItem[]>([
    { assetId: '', amount: 0, type: 'xch', symbol: '', searchQuery: '', showDropdown: false },
  ])

  // Shared filter state
  const sharedSearchValue = ref('')
  const sharedFilteredSuggestions = ref<SuggestionItem[]>([])
  const sharedFilters = reactive<FilterState>({
    buyAsset: [],
    sellAsset: [],
    status: [],
  })

  // Order book data
  const orderBookData = ref<OrderBookOrder[]>([])
  const orderBookLoading = ref(false)
  const orderBookHasMore = ref(true)
  const selectedOrderForTaking = ref<OrderBookOrder | null>(null)
  const fetchedOfferString = ref<string>('')
  const orderBookPage = ref(0)

  // Order history data
  const displayedTrades = ref<Trade[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const page = ref(0)

  // Constants
  const rowsPerPage = 20

  // Computed
  const hasActiveSharedFilters = computed(() => {
    return Object.values(sharedFilters).some(f => f && f.length > 0)
  })

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

      if (data.mode === 'maker' || activeView.value === 'create') {
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

  // Shared filter methods
  const handleSharedSearchChange = () => {
    // Generate suggestions from both order book and order history data
    const suggestions: SuggestionItem[] = []
    const lowerSearch = sharedSearchValue.value.toLowerCase()

    // Get unique assets from order book data
    const orderBookAssets = new Set<string>()
    orderBookData.value.forEach(order => {
      order.offering.forEach(asset => {
        const tickerSymbol = getTickerSymbol(asset.id)
        if (tickerSymbol) {
          orderBookAssets.add(tickerSymbol)
        }
      })
      order.receiving.forEach(asset => {
        const tickerSymbol = getTickerSymbol(asset.id)
        if (tickerSymbol) {
          orderBookAssets.add(tickerSymbol)
        }
      })
    })

    // Get unique assets from order history data
    const orderHistoryAssets = new Set<string>()
    displayedTrades.value.forEach(trade => {
      trade.sellAssets.forEach(asset => {
        const tickerSymbol = getTickerSymbol(asset.id)
        if (tickerSymbol) {
          orderHistoryAssets.add(tickerSymbol)
        }
      })
      trade.buyAssets.forEach(asset => {
        const tickerSymbol = getTickerSymbol(asset.id)
        if (tickerSymbol) {
          orderHistoryAssets.add(tickerSymbol)
        }
      })
    })

    // Combine all unique assets
    const allAssets = new Set([...orderBookAssets, ...orderHistoryAssets])

    // Generate suggestions
    allAssets.forEach(tickerSymbol => {
      if (tickerSymbol.toLowerCase().includes(lowerSearch)) {
        if (!sharedFilters.buyAsset.includes(tickerSymbol)) {
          suggestions.push({
            value: tickerSymbol,
            column: 'buyAsset',
            label: `Buy ${tickerSymbol}`,
          })
        }
        if (!sharedFilters.sellAsset.includes(tickerSymbol)) {
          suggestions.push({
            value: tickerSymbol,
            column: 'sellAsset',
            label: `Sell ${tickerSymbol}`,
          })
        }
      }
    })

    // Add status suggestions
    const statusOptions = ['Open', 'Filled', 'Cancelled', 'Partial']
    statusOptions.forEach(status => {
      if (
        status.toLowerCase().includes(lowerSearch) &&
        !(sharedFilters.status?.includes(status) ?? false)
      ) {
        suggestions.push({
          value: status,
          column: 'status',
          label: `Status: ${status}`,
        })
      }
    })

    sharedFilteredSuggestions.value = suggestions
  }

  const addSharedFilter = (column: string, value: string) => {
    if (column === 'buyAsset' && !sharedFilters.buyAsset.includes(value)) {
      sharedFilters.buyAsset.push(value)
    } else if (column === 'sellAsset' && !sharedFilters.sellAsset.includes(value)) {
      sharedFilters.sellAsset.push(value)
    } else if (column === 'status' && !(sharedFilters.status?.includes(value) ?? false)) {
      if (!sharedFilters.status) {
        sharedFilters.status = []
      }
      sharedFilters.status.push(value)
    }
    sharedSearchValue.value = ''
    sharedFilteredSuggestions.value = []
  }

  const removeSharedFilter = (column: keyof FilterState, value: string) => {
    if (column === 'buyAsset') {
      const index = sharedFilters.buyAsset.indexOf(value)
      if (index > -1) {
        sharedFilters.buyAsset.splice(index, 1)
      }
    } else if (column === 'sellAsset') {
      const index = sharedFilters.sellAsset.indexOf(value)
      if (index > -1) {
        sharedFilters.sellAsset.splice(index, 1)
      }
    } else if (column === 'status' && sharedFilters.status) {
      const index = sharedFilters.status.indexOf(value)
      if (index > -1) {
        sharedFilters.status.splice(index, 1)
      }
    }
  }

  const clearAllSharedFilters = () => {
    sharedFilters.buyAsset = []
    sharedFilters.sellAsset = []
    sharedFilters.status = []
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
    if (
      (activeView.value === 'create' || activeView.value === 'take') &&
      orderBookData.value.length === 0
    ) {
      loadOrderBookData()
    }
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
    @apply min-h-screen bg-gray-50 dark:bg-gray-900 px-1 sm:px-2 lg:px-3 py-0 sm:py-1 lg:py-1;
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
