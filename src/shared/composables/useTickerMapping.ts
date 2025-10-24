import { useTickerData } from './useTickerData'

/**
 * Global composable for ticker mapping throughout the app
 * Provides human-readable ticker names for asset IDs
 */
export function useTickerMapping() {
  const { catTokenMap, getCatTokenInfo } = useTickerData()

  /**
   * Get human-readable ticker symbol for an asset ID
   */
  const getTickerSymbol = (assetId: string): string => {
    const tokenInfo = getCatTokenInfo(assetId)
    return tokenInfo.ticker
  }

  /**
   * Get full token info for an asset ID
   */
  const getTokenInfo = (assetId: string) => {
    return getCatTokenInfo(assetId)
  }

  /**
   * Format asset display with ticker symbol
   */
  const formatAssetWithTicker = (assetId: string, amount: number): string => {
    const ticker = getTickerSymbol(assetId)
    return `${amount} ${ticker}`
  }

  /**
   * Check if asset is XCH (including testnet TXCH)
   */
  const isXchAsset = (assetId: string): boolean => {
    return assetId === 'xch' || assetId === 'TXCH'
  }

  /**
   * Check if asset is TDBX
   */
  const isTdbxAsset = (assetId: string): boolean => {
    return (
      assetId === 'TDBX' ||
      assetId === 'tdbx' ||
      assetId === '4eadfa450c19fa51df65eb7fbf5b61077ec80ec799a7652bb187b705bff19a90' ||
      assetId.toLowerCase().includes('tdbx')
    )
  }

  /**
   * Check if asset is a CAT token
   */
  const isCatAsset = (assetId: string): boolean => {
    return !isXchAsset(assetId)
  }

  return {
    catTokenMap,
    getTickerSymbol,
    getTokenInfo,
    formatAssetWithTicker,
    isXchAsset,
    isTdbxAsset,
    isCatAsset,
  }
}
