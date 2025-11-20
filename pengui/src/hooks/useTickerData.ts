'use client'

import { useDexieDataService } from '@/hooks/useDexieDataService'
import { useCatTokens, getCatTokenInfoSync, type CatTokenInfo } from '@/hooks/useTickers'

/**
 * Hook for ticker data and CAT token management
 * Provides human-readable CAT token information
 *
 * @deprecated This hook is being refactored. Use useCatTokens() and useCatTokenInfo() directly.
 * This wrapper is kept for backward compatibility during migration.
 */
export function useTickerData() {
  const { catTokenMap, availableCatTokens, isLoading, isError, error, refetch } = useCatTokens()
  const dexieDataService = useDexieDataService()

  /**
   * Get human-readable CAT token info
   */
  const getCatTokenInfoForAsset = (assetId: string): CatTokenInfo => {
    return getCatTokenInfoSync(assetId, catTokenMap)
  }

  /**
   * Get ticker for a specific asset
   * @deprecated Use useCatTokens().getCatTokenInfo() instead - ticker data comes from TanStack Query
   */
  const getTickerForAsset = async (assetId: string) => {
    // Return token info from the cached ticker data
    const tokenInfo = getCatTokenInfoForAsset(assetId)
    return {
      success: true,
      data: [
        {
          ticker_id: `${assetId}_xch`,
          base_currency: assetId,
          target_currency: 'xch',
          base_code: tokenInfo.ticker,
          target_code: 'XCH',
          base_name: tokenInfo.name,
          target_name: 'Chia',
        },
      ],
    }
  }

  /**
   * Get order book for a specific asset
   */
  const getOrderBookForAsset = async (assetId: string, depth: number = 10) => {
    return await dexieDataService.getOrderBook({ tickerId: assetId, depth })
  }

  /**
   * Get historical trades for a specific asset
   */
  const getHistoricalTradesForAsset = async (assetId: string, limit: number = 100) => {
    return await dexieDataService.getHistoricalTrades({ tickerId: assetId, limit })
  }

  /**
   * Format asset display with human-readable name
   */
  const formatAssetDisplay = (assetId: string, amount: number): string => {
    const tokenInfo = getCatTokenInfoForAsset(assetId)
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
    tickers: [], // Deprecated - use useTickers() directly
    catTokenMap,
    availableCatTokens,

    // Loading states
    isLoading,
    isError,
    error,

    // Methods
    getCatTokenInfo: getCatTokenInfoForAsset,
    getTickerForAsset,
    getOrderBookForAsset,
    getHistoricalTradesForAsset,
    formatAssetDisplay,
    isXchAsset,
    isCatAsset,

    // Query for manual refresh
    refetchTickers: refetch,
  }
}

// Re-export types for backward compatibility
export type { CatTokenInfo } from '@/hooks/useTickers'
