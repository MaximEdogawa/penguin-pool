import { dexieRepository } from '@/shared/repositories/DexieRepository'
import {
  createCatTokenMap,
  getCatTokenInfo as getCatTokenInfoUtil,
  useDexieDataService,
  type CatTokenInfo,
} from '@/shared/services/DexieDataService'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

/**
 * Composable for ticker data and CAT token management
 * Provides human-readable CAT token information
 */
export function useTickerData() {
  const dexieDataService = useDexieDataService()

  // Tickers query with daily invalidation
  const tickersQuery = useQuery({
    queryKey: ['dexie', 'tickers'],
    queryFn: async () => {
      return await dexieRepository.getAllTickers()
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  })

  // CAT token map for human-readable names
  const catTokenMap = computed(() => {
    let map = new Map<string, CatTokenInfo>()

    // Add API data if available
    if (tickersQuery.data.value?.success && tickersQuery.data.value.data) {
      map = createCatTokenMap(tickersQuery.data.value.data)
    }

    // Always add essential fallback tokens (TXCH and TDBX) for testing
    const fallbackTokens: CatTokenInfo[] = [
      {
        assetId: 'd82dd03f8a9ad2f84353cd953c4de6b21dbaaf7de3ba3f4ddd9abe31ecba80ad',
        ticker: 'TXCH',
        name: 'TXCH',
        symbol: 'TXCH',
      },
      {
        assetId: '4eadfa450c19fa51df65eb7fbf5b61077ec80ec799a7652bb187b705bff19a90',
        ticker: 'TDBX',
        name: 'TDBX',
        symbol: 'TDBX',
      },
    ]

    // Add fallback tokens to the map
    fallbackTokens.forEach(token => {
      map.set(token.assetId, token)
    })

    return map
  })

  // Available CAT tokens list
  const availableCatTokens = computed(() => {
    const tokens: CatTokenInfo[] = []
    catTokenMap.value.forEach(tokenInfo => {
      tokens.push(tokenInfo)
    })

    // Always include essential fallback tokens (TXCH and TDBX) for testing
    const fallbackTokens: CatTokenInfo[] = [
      {
        assetId: 'd82dd03f8a9ad2f84353cd953c4de6b21dbaaf7de3ba3f4ddd9abe31ecba80ad',
        ticker: 'TXCH',
        name: 'TXCH',
        symbol: 'TXCH',
      },
      {
        assetId: '4eadfa450c19fa51df65eb7fbf5b61077ec80ec799a7652bb187b705bff19a90',
        ticker: 'TDBX',
        name: 'TDBX',
        symbol: 'TDBX',
      },
    ]

    // If no tokens from API, return only fallback tokens
    if (tokens.length === 0 && !tickersQuery.isLoading.value) {
      return fallbackTokens
    }

    // If API has tokens, merge with fallback tokens and remove duplicates
    const allTokens = [...tokens, ...fallbackTokens]
    const uniqueTokens = allTokens.filter(
      (token, index, self) => index === self.findIndex(t => t.ticker === token.ticker)
    )

    return uniqueTokens.sort((a, b) => a.ticker.localeCompare(b.ticker))
  })

  /**
   * Get human-readable CAT token info
   */
  const getCatTokenInfo = (assetId: string): CatTokenInfo => {
    return getCatTokenInfoUtil(assetId, catTokenMap.value)
  }

  /**
   * Get ticker for a specific asset
   */
  const getTickerForAsset = async (assetId: string) => {
    try {
      return await dexieDataService.getTicker(assetId)
    } catch (error) {
      throw error
    }
  }

  /**
   * Get order book for a specific asset
   */
  const getOrderBookForAsset = async (assetId: string, depth: number = 10) => {
    try {
      return await dexieDataService.getOrderBook(assetId, depth)
    } catch (error) {
      throw error
    }
  }

  /**
   * Get historical trades for a specific asset
   */
  const getHistoricalTradesForAsset = async (assetId: string, limit: number = 100) => {
    try {
      return await dexieDataService.getHistoricalTrades(assetId, limit)
    } catch (error) {
      throw error
    }
  }

  /**
   * Format asset display with human-readable name
   */
  const formatAssetDisplay = (assetId: string, amount: number): string => {
    const tokenInfo = getCatTokenInfo(assetId)
    return `${amount} ${tokenInfo.ticker}`
  }

  /**
   * Check if asset is XCH (including testnet TXCH)
   */
  const isXchAsset = (assetId: string): boolean => {
    return (
      assetId === 'xch' ||
      assetId === 'TXCH' ||
      assetId === 'd82dd03f8a9ad2f84353cd953c4de6b21dbaaf7de3ba3f4ddd9abe31ecba80ad'
    )
  }

  /**
   * Check if asset is a CAT token
   */
  const isCatAsset = (assetId: string): boolean => {
    return !isXchAsset(assetId)
  }

  return {
    // Data
    tickers: computed(() => tickersQuery.data.value?.data || []),
    catTokenMap,
    availableCatTokens,

    // Loading states
    isLoading: computed(() => tickersQuery.isLoading.value),
    isError: computed(() => tickersQuery.isError.value),
    error: computed(() => tickersQuery.error.value),

    // Methods
    getCatTokenInfo,
    getTickerForAsset,
    getOrderBookForAsset,
    getHistoricalTradesForAsset,
    formatAssetDisplay,
    isXchAsset,
    isCatAsset,

    // Query for manual refresh
    refetchTickers: tickersQuery.refetch,
  }
}
