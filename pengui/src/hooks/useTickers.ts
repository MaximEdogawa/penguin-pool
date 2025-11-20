'use client'

import { environment } from '@/lib/config/environment'
import type { DexieTicker } from '@/lib/dexie/DexieRepository'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

const DEXIE_KEY = 'dexie'
const TICKERS_KEY = 'tickers'
const DEXIE_API_BASE_URL = environment.dexie.apiBaseUrl

export interface CatTokenInfo {
  assetId: string
  ticker: string
  name: string
  symbol: string
}

/**
 * Fallback tokens that should always be available
 */
const FALLBACK_TOKENS: CatTokenInfo[] = [
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

/**
 * Create a map of CAT tokens from ticker data
 */
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

  // Add fallback tokens
  FALLBACK_TOKENS.forEach((token) => {
    catMap.set(token.assetId, token)
  })

  return catMap
}

/**
 * Get CAT token info from a map
 */
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
 * Hook to fetch all tickers from Dexie API using TanStack Query
 */
export function useTickers() {
  return useQuery({
    queryKey: [DEXIE_KEY, TICKERS_KEY],
    queryFn: async () => {
      const response = await fetch(`${DEXIE_API_BASE_URL}/v3/prices/tickers`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const tickersArray = Array.isArray(data.json)
        ? data.json
        : Array.isArray(data.tickers)
          ? data.tickers
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : []

      return {
        success: true,
        data: tickersArray,
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}

/**
 * Hook to get processed CAT token data from tickers
 */
export function useCatTokens() {
  const tickersQuery = useTickers()

  const catTokenMap = useMemo(() => {
    const map = new Map<string, CatTokenInfo>()

    // Process tickers if available
    if (tickersQuery.data?.success && tickersQuery.data.data) {
      const processedMap = createCatTokenMap(tickersQuery.data.data)
      processedMap.forEach((value, key) => {
        map.set(key, value)
      })
    } else {
      // Use fallback tokens if no data
      FALLBACK_TOKENS.forEach((token) => {
        map.set(token.assetId, token)
      })
    }

    return map
  }, [tickersQuery.data])

  // Create available tokens list
  const availableCatTokens = useMemo(() => {
    return Array.from(catTokenMap.values()).sort((a, b) => a.ticker.localeCompare(b.ticker))
  }, [catTokenMap])

  return {
    catTokenMap,
    availableCatTokens,
    isLoading: tickersQuery.isLoading,
    isError: tickersQuery.isError,
    error: tickersQuery.error,
    refetch: tickersQuery.refetch,
    // Helper to get token info synchronously
    getCatTokenInfo: (assetId: string) => getCatTokenInfo(assetId, catTokenMap),
  }
}

/**
 * Get CAT token info for a specific asset ID (non-hook version for use in callbacks)
 */
export function getCatTokenInfoSync(
  assetId: string,
  catTokenMap: Map<string, CatTokenInfo>
): CatTokenInfo {
  return getCatTokenInfo(assetId, catTokenMap)
}
