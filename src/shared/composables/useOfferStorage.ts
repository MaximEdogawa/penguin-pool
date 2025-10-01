import {
  offerStorageService,
  type OfferStorageOptions,
  type StoredOffer,
} from '@/shared/services/OfferStorageService'
import type { OfferDetails } from '@/types/offer.types'
import { computed, ref } from 'vue'

export function useOfferStorage() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const offers = ref<StoredOffer[]>([])

  // Computed properties
  const localOffers = computed(() => offers.value.filter(offer => offer.isLocal))
  const syncedOffers = computed(() => offers.value.filter(offer => !offer.isLocal))
  const activeOffers = computed(() => offers.value.filter(offer => offer.status === 'active'))
  const cancelledOffers = computed(() => offers.value.filter(offer => offer.status === 'cancelled'))

  /**
   * Load offers from IndexedDB
   */
  const loadOffers = async (options: OfferStorageOptions = {}) => {
    isLoading.value = true
    error.value = null

    try {
      offers.value = await offerStorageService.getOffers(options)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load offers'
      console.error('Failed to load offers:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Save a new offer
   */
  const saveOffer = async (offer: OfferDetails, isLocal: boolean = true) => {
    isLoading.value = true
    error.value = null

    try {
      // For now, we'll save offers without wallet address
      // This can be enhanced later when wallet connection is properly established
      const walletAddress: string | undefined = undefined

      const savedOffer = await offerStorageService.saveOffer(offer, isLocal, walletAddress)
      offers.value.unshift(savedOffer)
      return savedOffer
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save offer'
      console.error('Failed to save offer:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update an existing offer
   */
  const updateOffer = async (offerId: string, updates: Partial<OfferDetails>) => {
    isLoading.value = true
    error.value = null

    try {
      await offerStorageService.updateOffer(offerId, updates)

      // Update local state
      const index = offers.value.findIndex(offer => offer.id === offerId)
      if (index !== -1) {
        offers.value[index] = { ...offers.value[index], ...updates, lastModified: new Date() }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update offer'
      console.error('Failed to update offer:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Delete an offer
   */
  const deleteOffer = async (offerId: string) => {
    isLoading.value = true
    error.value = null

    try {
      await offerStorageService.deleteOffer(offerId)

      // Remove from local state
      const index = offers.value.findIndex(offer => offer.id === offerId)
      if (index !== -1) {
        offers.value.splice(index, 1)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete offer'
      console.error('Failed to delete offer:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get offers by status
   */
  const getOffersByStatus = async (status: string, walletAddress?: string) => {
    isLoading.value = true
    error.value = null

    try {
      const statusOffers = await offerStorageService.getOffersByStatus(status, walletAddress)
      return statusOffers
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get offers by status'
      console.error('Failed to get offers by status:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get unsynced offers
   */
  const getUnsyncedOffers = async () => {
    isLoading.value = true
    error.value = null

    try {
      const unsyncedOffers = await offerStorageService.getUnsyncedOffers()
      return unsyncedOffers
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to get unsynced offers'
      console.error('Failed to get unsynced offers:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Mark offers as synced
   */
  const markOffersAsSynced = async (offerIds: string[]) => {
    isLoading.value = true
    error.value = null

    try {
      await offerStorageService.markOffersAsSynced(offerIds)

      // Update local state
      offerIds.forEach(offerId => {
        const offer = offers.value.find(o => o.id === offerId)
        if (offer) {
          offer.isLocal = false
          offer.syncedAt = new Date()
          offer.lastModified = new Date()
        }
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to mark offers as synced'
      console.error('Failed to mark offers as synced:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear all offers
   */
  const clearAllOffers = async () => {
    isLoading.value = true
    error.value = null

    try {
      await offerStorageService.clearAllOffers()
      offers.value = []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to clear offers'
      console.error('Failed to clear offers:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get database statistics
   */
  const getStats = async () => {
    try {
      return await offerStorageService.getStats()
    } catch (err) {
      console.error('Failed to get stats:', err)
      throw err
    }
  }

  return {
    // State
    isLoading,
    error,
    offers,

    // Computed
    localOffers,
    syncedOffers,
    activeOffers,
    cancelledOffers,

    // Methods
    loadOffers,
    saveOffer,
    updateOffer,
    deleteOffer,
    getOffersByStatus,
    getUnsyncedOffers,
    markOffersAsSynced,
    clearAllOffers,
    getStats,
  }
}
