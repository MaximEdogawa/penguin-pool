'use client'

import { offerStorageService, type OfferStorageOptions } from '@/lib/services/offerStorageService'
import type { StoredOffer } from '@/lib/database/indexedDB'
import type { OfferDetails } from '@/types/offer.types'
import { useCallback, useMemo, useState } from 'react'

export function useOfferStorage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offers, setOffers] = useState<StoredOffer[]>([])

  // Computed properties
  const localOffers = useMemo(() => offers.filter((offer) => offer.isLocal), [offers])
  const syncedOffers = useMemo(() => offers.filter((offer) => !offer.isLocal), [offers])
  const activeOffers = useMemo(() => offers.filter((offer) => offer.status === 'active'), [offers])
  const cancelledOffers = useMemo(
    () => offers.filter((offer) => offer.status === 'cancelled'),
    [offers]
  )

  /**
   * Load offers from IndexedDB
   */
  const loadOffers = useCallback(async (options: OfferStorageOptions = {}) => {
    setIsLoading(true)
    setError(null)

    try {
      const loadedOffers = await offerStorageService.getOffers(options)
      setOffers(loadedOffers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load offers')
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Save a new offer
   */
  const saveOffer = useCallback(async (offer: OfferDetails, isLocal: boolean = true) => {
    setIsLoading(true)
    setError(null)

    try {
      const walletAddress: string | undefined = undefined
      const savedOffer = await offerStorageService.saveOffer(offer, isLocal, walletAddress)
      setOffers((prev) => [savedOffer, ...prev])
      return savedOffer
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save offer')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Update an existing offer
   */
  const updateOffer = useCallback(async (offerId: string, updates: Partial<OfferDetails>) => {
    setIsLoading(true)
    setError(null)

    try {
      await offerStorageService.updateOffer(offerId, updates)

      // Reload from storage to ensure consistency across all components
      const loadedOffers = await offerStorageService.getOffers({})
      setOffers(loadedOffers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update offer')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Delete an offer
   */
  const deleteOffer = useCallback(async (offerId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await offerStorageService.deleteOffer(offerId)

      // Reload from storage to ensure consistency across all components
      const loadedOffers = await offerStorageService.getOffers({})
      setOffers(loadedOffers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete offer')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Get offers by status
   */
  const getOffersByStatus = useCallback(async (status: string, walletAddress?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const statusOffers = await offerStorageService.getOffersByStatus(status, walletAddress)
      return statusOffers
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get offers by status')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Get unsynced offers
   */
  const getUnsyncedOffers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const unsyncedOffers = await offerStorageService.getUnsyncedOffers()
      return unsyncedOffers
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get unsynced offers')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Mark offers as synced
   */
  const markOffersAsSynced = useCallback(async (offerIds: string[]) => {
    setIsLoading(true)
    setError(null)

    try {
      await offerStorageService.markOffersAsSynced(offerIds)

      // Update local state
      setOffers((prev) =>
        prev.map((offer) => {
          if (offerIds.includes(offer.id)) {
            return {
              ...offer,
              isLocal: false,
              syncedAt: new Date(),
              lastModified: new Date(),
            }
          }
          return offer
        })
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark offers as synced')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Clear all offers
   */
  const clearAllOffers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await offerStorageService.clearAllOffers()
      setOffers([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear offers')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Get database statistics
   */
  const getStats = useCallback(async () => {
    return await offerStorageService.getStats()
  }, [])

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
