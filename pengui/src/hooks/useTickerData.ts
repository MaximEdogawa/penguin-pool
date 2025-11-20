'use client'

import type { DexieTicker } from '@/lib/dexie/DexieRepository'
import { useDexieDataService } from '@/hooks/useDexieDataService'
import { useMemo } from 'react'

export interface CatTokenInfo {
  assetId: string
  ticker: string
  name: string
  symbol: string
}

export function createCatTokenMap(tickers: DexieTicker[]): Map<string, CatTokenInfo> {
  const catMap = new Map<string, CatTokenInfo>()

  tickers.forEach((ticker) => {
    // Include both XCH and TXCH as valid target currencies
    const isXchTarget =
      ticker.target_currency === 'xch' ||
      ticker.target_currency === 'TXCH' ||
      ticker.target_currency === 'd82dd03f8a9ad2f84353cd953c4de6b21dbaaf7de3ba3f4ddd9abe31ecba80ad'

    const isNotXchBase =
      ticker.base_currency !== 'xch' &&
      ticker.base_currency !== 'TXCH' &&
      ticker.base_currency !== 'd82dd03f8a9ad2f84353cd953c4de6b21dbaaf7de3ba3f4ddd9abe31ecba80ad'

    if (isXchTarget && isNotXchBase) {
      catMap.set(ticker.base_currency, {
        assetId: ticker.base_currency,
        ticker: ticker.base_code,
        name: ticker.base_name,
        symbol: ticker.base_code,
      })
    }
  })

  return catMap
}

export function getCatTokenInfo(assetId: string, catMap: Map<string, CatTokenInfo>): CatTokenInfo {
  return (
    catMap.get(assetId) || {
      assetId,
      ticker: assetId,
      name: assetId,
      symbol: assetId,
    }
  )
}

/**
 * Hook for ticker data and CAT token management
 * Provides human-readable CAT token information
 */
export function useTickerData() {
  const dexieDataService = useDexieDataService()

  // CAT token map for human-readable names
  const catTokenMap = useMemo(() => {
    let map = new Map<string, CatTokenInfo>()

    // Add API data if available
    if (dexieDataService.tickersQuery.data?.success && dexieDataService.tickersQuery.data.data) {
      map = createCatTokenMap(dexieDataService.tickersQuery.data.data)
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
    fallbackTokens.forEach((token) => {
      map.set(token.assetId, token)
    })

    return map
  }, [dexieDataService.tickersQuery.data])

  // Available CAT tokens list
  const availableCatTokens = useMemo(() => {
    const tokens: CatTokenInfo[] = []
    catTokenMap.forEach((tokenInfo) => {
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
    if (tokens.length === 0 && !dexieDataService.tickersQuery.isLoading) {
      return fallbackTokens
    }

    // If API has tokens, merge with fallback tokens and remove duplicates by assetId
    // Deduplicate by assetId (not ticker) to ensure correct mapping
    const allTokens = [...tokens, ...fallbackTokens]
    const uniqueTokens = allTokens.filter(
      (token, index, self) => index === self.findIndex((t) => t.assetId === token.assetId)
    )

    return uniqueTokens.sort((a, b) => a.ticker.localeCompare(b.ticker))
  }, [catTokenMap, dexieDataService.tickersQuery.isLoading])

  /**
   * Get human-readable CAT token info
   */
  const getCatTokenInfoForAsset = (assetId: string): CatTokenInfo => {
    return getCatTokenInfo(assetId, catTokenMap)
  }

  /**
   * Get ticker for a specific asset
   */
  const getTickerForAsset = async (assetId: string) => {
    return await dexieDataService.getTicker(assetId)
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
    tickers: dexieDataService.tickersQuery.data?.data || [],
    catTokenMap,
    availableCatTokens,

    // Loading states
    isLoading: dexieDataService.tickersQuery.isLoading,
    isError: dexieDataService.tickersQuery.isError,
    error: dexieDataService.tickersQuery.error,

    // Methods
    getCatTokenInfo: getCatTokenInfoForAsset,
    getTickerForAsset,
    getOrderBookForAsset,
    getHistoricalTradesForAsset,
    formatAssetDisplay,
    isXchAsset,
    isCatAsset,

    // Query for manual refresh
    refetchTickers: dexieDataService.tickersQuery.refetch,
  }
}
