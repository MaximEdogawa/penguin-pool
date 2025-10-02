import type { DexiePostOfferParams, DexieSearchParams } from '@/shared/services/DexieDataService'
import { useDexieDataService } from '@/shared/services/DexieDataService'

/**
 * Composable for offer inspection and search using Dexie API
 * Provides a convenient interface for components to interact with Dexie
 */
export function useOfferInspection() {
  const dexieDataService = useDexieDataService()

  /**
   * Inspect a specific offer by offer string
   */
  const inspectOffer = async (offerString: string) => {
    try {
      return await dexieDataService.inspectOffer(offerString)
    } catch (error) {
      throw error
    }
  }

  /**
   * Search for offers with various filters
   */
  const searchOffers = async (params: DexieSearchParams = {}) => {
    try {
      return await dexieDataService.searchOffers(params)
    } catch (error) {
      throw error
    }
  }

  /**
   * Post an offer to Dexie
   */
  const postOffer = async (params: DexiePostOfferParams) => {
    try {
      return await dexieDataService.postOffer(params)
    } catch (error) {
      throw error
    }
  }

  /**
   * Search for offers by asset ID
   */
  const searchOffersByAsset = async (assetId: string, limit = 20) => {
    return await searchOffers({
      asset_id: assetId,
      status: 0, // Only open offers
      limit,
      sort_by: 'created_at',
      sort_order: 'desc',
    })
  }

  /**
   * Search for offers by maker address
   */
  const searchOffersByMaker = async (makerAddress: string, limit = 20) => {
    return await searchOffers({
      maker_address: makerAddress,
      limit,
      sort_by: 'created_at',
      sort_order: 'desc',
    })
  }

  /**
   * Get recent offers
   */
  const getRecentOffers = async (limit = 50) => {
    return await searchOffers({
      status: 0, // Only open offers
      limit,
      sort_by: 'created_at',
      sort_order: 'desc',
    })
  }

  return {
    // Direct service access
    dexieDataService,

    // Convenience methods
    inspectOffer,
    searchOffers,
    postOffer,
    searchOffersByAsset,
    searchOffersByMaker,
    getRecentOffers,

    // Loading states
    isLoading: dexieDataService.isLoading,
    isSearching: dexieDataService.isSearching,
    isInspecting: dexieDataService.isInspecting,
    isPosting: dexieDataService.isPosting,

    // Error state
    error: dexieDataService.error,

    // Data
    offers: dexieDataService.offers,
    currentOffer: dexieDataService.currentOffer,
  }
}
