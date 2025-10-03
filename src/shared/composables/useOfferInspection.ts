import type {
  DexiePostOfferParams,
  DexieSearchParams,
  ValidatedOfferString,
} from '@/shared/services/DexieDataService'
import { useDexieDataService, validateOfferString } from '@/shared/services/DexieDataService'

/**
 * Composable for offer inspection and search using Dexie API
 * Provides a convenient interface for components to interact with Dexie
 */
export function useOfferInspection() {
  const dexieDataService = useDexieDataService()

  /**
   * Inspect a specific offer by Dexie ID
   */
  const inspectOffer = async (dexieId: string) => {
    try {
      return await dexieDataService.inspectOffer(dexieId)
    } catch (error: unknown) {
      throw error
    }
  }

  /**
   * Inspect offer with polling functionality - checks every 20 seconds until expired/completed/cancelled
   */
  const inspectOfferWithPolling = async (dexieId: string, maxAttempts: number = 30) => {
    try {
      return await dexieDataService.inspectOfferWithPolling(dexieId, maxAttempts)
    } catch (error) {
      throw error
    }
  }

  /**
   * Validate an offer string before processing
   */
  const validateOffer = (offerString: string): ValidatedOfferString => {
    return validateOfferString(offerString)
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
   * Get offer by ID
   */
  const getOfferById = async (offerId: string) => {
    try {
      return await dexieDataService.inspectOffer(offerId)
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
    inspectOfferWithPolling,
    searchOffers,
    getOfferById,
    postOffer,
    searchOffersByAsset,
    searchOffersByMaker,
    getRecentOffers,
    validateOffer,

    // Enhanced mutation access
    searchOffersMutation: dexieDataService.searchOffersMutation,
    inspectOfferMutation: dexieDataService.inspectOfferMutation,
    postOfferMutation: dexieDataService.postOfferMutation,

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

    // Refresh functions
    refreshOffers: dexieDataService.refreshOffers,
  }
}
