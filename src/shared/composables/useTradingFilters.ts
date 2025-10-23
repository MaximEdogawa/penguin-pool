import type { FilterState, OrderBookOrder, SuggestionItem, Trade } from '@/pages/Trading/types'
import { computed, reactive, ref, watch } from 'vue'
import { useTickerMapping } from './useTickerMapping'

export function useTradingFilters() {
  const { getTickerSymbol } = useTickerMapping()

  // State
  const sharedSearchValue = ref('')
  const sharedFilteredSuggestions = ref<SuggestionItem[]>([])
  const assetsSwapped = ref(false)
  const sharedFilters = reactive<FilterState>({
    buyAsset: [],
    sellAsset: [],
    status: [],
  })

  // Session store for filter persistence
  const sessionFilterStore = ref<{
    buyAsset: string[]
    sellAsset: string[]
    status: string[]
    searchValue: string
  }>({
    buyAsset: [],
    sellAsset: [],
    status: [],
    searchValue: '',
  })

  // Computed
  const hasActiveSharedFilters = computed(() => {
    return Object.values(sharedFilters).some(f => f && f.length > 0)
  })

  // Methods
  const handleSharedSearchChange = (orderBookData: OrderBookOrder[], displayedTrades: Trade[]) => {
    // Generate suggestions from both order book and order history data
    const suggestions: SuggestionItem[] = []
    const lowerSearch = sharedSearchValue.value.toLowerCase()

    // Get unique assets from order book data
    const orderBookAssets = new Set<string>()
    orderBookData.forEach(order => {
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
    displayedTrades.forEach(trade => {
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
        if (
          !sharedFilters.buyAsset.some(
            filter => filter.toLowerCase() === tickerSymbol.toLowerCase()
          )
        ) {
          suggestions.push({
            value: tickerSymbol,
            column: 'buyAsset',
            label: `Buy ${tickerSymbol}`,
          })
        }
        if (
          !sharedFilters.sellAsset.some(
            filter => filter.toLowerCase() === tickerSymbol.toLowerCase()
          )
        ) {
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
    if (
      column === 'buyAsset' &&
      !sharedFilters.buyAsset.some(filter => filter.toLowerCase() === value.toLowerCase())
    ) {
      sharedFilters.buyAsset.push(value)
    } else if (
      column === 'sellAsset' &&
      !sharedFilters.sellAsset.some(filter => filter.toLowerCase() === value.toLowerCase())
    ) {
      sharedFilters.sellAsset.push(value)
    } else if (
      column === 'status' &&
      !(sharedFilters.status?.some(filter => filter.toLowerCase() === value.toLowerCase()) ?? false)
    ) {
      if (!sharedFilters.status) {
        sharedFilters.status = []
      }
      sharedFilters.status.push(value)
    }
    sharedSearchValue.value = ''
    sharedFilteredSuggestions.value = []
    saveFilterState()
  }

  const removeSharedFilter = (column: keyof FilterState, value: string) => {
    if (column === 'buyAsset') {
      const index = sharedFilters.buyAsset.findIndex(
        filter => filter.toLowerCase() === value.toLowerCase()
      )
      if (index > -1) {
        sharedFilters.buyAsset.splice(index, 1)
      }
    } else if (column === 'sellAsset') {
      const index = sharedFilters.sellAsset.findIndex(
        filter => filter.toLowerCase() === value.toLowerCase()
      )
      if (index > -1) {
        sharedFilters.sellAsset.splice(index, 1)
      }
    } else if (column === 'status' && sharedFilters.status) {
      const index = sharedFilters.status.findIndex(
        filter => filter.toLowerCase() === value.toLowerCase()
      )
      if (index > -1) {
        sharedFilters.status.splice(index, 1)
      }
    }
    saveFilterState()
  }

  const clearAllSharedFilters = () => {
    sharedFilters.buyAsset = []
    sharedFilters.sellAsset = []
    sharedFilters.status = []
    saveFilterState()
  }

  const swapBuySellAssets = () => {
    // Swap the buy and sell asset arrays
    const tempBuyAssets = [...sharedFilters.buyAsset]
    const tempSellAssets = [...sharedFilters.sellAsset]

    sharedFilters.buyAsset = tempSellAssets
    sharedFilters.sellAsset = tempBuyAssets

    // Toggle the swap state
    assetsSwapped.value = !assetsSwapped.value

    saveFilterState()
  }

  // Filter persistence methods
  const saveFilterState = () => {
    sessionFilterStore.value = {
      buyAsset: [...sharedFilters.buyAsset],
      sellAsset: [...sharedFilters.sellAsset],
      status: [...(sharedFilters.status || [])],
      searchValue: sharedSearchValue.value,
    }
  }

  const loadFilterState = () => {
    sharedFilters.buyAsset = [...sessionFilterStore.value.buyAsset]
    sharedFilters.sellAsset = [...sessionFilterStore.value.sellAsset]
    sharedFilters.status = [...sessionFilterStore.value.status]
    sharedSearchValue.value = sessionFilterStore.value.searchValue
  }

  const setDefaultFilter = () => {
    // Set default TXCH TBYC filter (buy TXCH, sell TBYC)
    sharedFilters.buyAsset = ['TXCH']
    sharedFilters.sellAsset = ['TBYC']
    saveFilterState()
  }

  // Watch for filter changes to save state
  watch(
    sharedFilters,
    () => {
      saveFilterState()
    },
    { deep: true }
  )

  watch(sharedSearchValue, () => {
    saveFilterState()
  })

  return {
    // State
    sharedSearchValue,
    sharedFilteredSuggestions,
    assetsSwapped,
    sharedFilters,
    hasActiveSharedFilters,

    // Methods
    handleSharedSearchChange,
    addSharedFilter,
    removeSharedFilter,
    clearAllSharedFilters,
    swapBuySellAssets,
    saveFilterState,
    loadFilterState,
    setDefaultFilter,
  }
}
