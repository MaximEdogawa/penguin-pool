'use client'

import { useDexieDataService } from '@/hooks/useDexieDataService'
import { useOfferStorage } from '@/hooks/useOfferStorage'
import type { DexiePostOfferResponse } from '@/lib/dexie/dexieTypes'
import { logger } from '@/lib/logger'
import type { OfferDetails } from '@/types/offer.types'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

const POLLING_INTERVAL = 30000 // 30 seconds

/**
 * Hook to poll Dexie offer status for offers on the current page
 * Only polls offers that are uploaded to Dexie and have a dexieOfferId
 */
export function useDexieOfferPolling(offers: OfferDetails[]) {
  const dexieDataService = useDexieDataService()
  const offerStorage = useOfferStorage()

  // Filter offers that need polling (uploaded to Dexie and have dexieOfferId)
  const offersToPoll = useMemo(() => {
    return offers.filter(
      (offer) =>
        offer.uploadedToDexie &&
        offer.dexieOfferId &&
        // Only poll offers that are still active/pending (not completed/cancelled/expired)
        ['pending', 'active'].includes(offer.status)
    )
  }, [offers])

  // Poll each offer's status
  const pollResults = useQuery({
    queryKey: ['dexie-offer-polling', offersToPoll.map((o) => o.dexieOfferId).filter(Boolean)],
    queryFn: async () => {
      const results = await Promise.allSettled(
        offersToPoll.map(async (offer) => {
          if (!offer.dexieOfferId) return null

          try {
            const result = await dexieDataService.inspectOffer(offer.dexieOfferId)
            return {
              offerId: offer.id,
              dexieOfferId: offer.dexieOfferId,
              result,
            }
          } catch (error) {
            logger.error(`Failed to poll offer ${offer.dexieOfferId}:`, error)
            return null
          }
        })
      )

      return results
        .filter(
          (
            r
          ): r is PromiseFulfilledResult<{
            offerId: string
            dexieOfferId: string
            result: DexiePostOfferResponse
          }> => r.status === 'fulfilled' && r.value !== null
        )
        .map((r) => r.value)
    },
    enabled: offersToPoll.length > 0,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false, // Only poll when tab is active
  })

  // Update offers in IndexedDB when status changes
  useEffect(() => {
    if (!pollResults.data || pollResults.data.length === 0) return

    const updatePromises = pollResults.data.map(async ({ offerId, result }) => {
      if (!result.success || !result.offer) return

      const dexieStatus = result.offer.status
      const currentOffer = offers.find((o) => o.id === offerId)
      if (!currentOffer) return

      // Only update if status changed (compare numeric status)
      // Note: dexieStatus in OfferDetails is OfferState (string), but we compare the numeric status from API
      const currentDexieStatus = currentOffer.dexieOfferData
        ? (currentOffer.dexieOfferData as { status?: number })?.status
        : undefined
      if (currentDexieStatus !== dexieStatus) {
        // Map Dexie status to app status
        let newStatus = currentOffer.status
        if (dexieStatus === 3 || dexieStatus === 4) {
          // Completed states
          newStatus = 'completed'
        } else if (dexieStatus === 6) {
          // Cancelled/Expired
          newStatus = 'cancelled'
        }

        // Update in IndexedDB
        // Note: dexieStatus is a calculated OfferState, not the numeric status
        // We store the numeric status in dexieOfferData.offer.status
        await offerStorage.updateOffer(offerId, {
          dexieOfferData: result.offer,
          status: newStatus,
        })

        // Trigger a refresh event so the UI updates
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('offer-status-updated', { detail: { offerId } }))
        }
      }
    })

    Promise.allSettled(updatePromises).catch((error) => {
      logger.error('Failed to update offers from polling:', error)
    })
  }, [pollResults.data, offers, offerStorage])

  return {
    isPolling: pollResults.isFetching,
    polledCount: offersToPoll.length,
  }
}
