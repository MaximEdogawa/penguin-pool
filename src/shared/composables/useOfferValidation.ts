import { useQueryClient } from '@tanstack/vue-query'
import type { DexiePostOfferResponse } from '../repositories/DexieRepository'
import { dexieRepository } from '../repositories/DexieRepository'

/**
 * Composable for validating offer state from Dexie
 * Provides real-time status updates for uploaded offers
 */
export function useOfferValidation() {
  const queryClient = useQueryClient()

  /**
   * Validate offer state by Dexie offer ID
   */
  const validateOfferState = async (
    dexieOfferId: string
  ): Promise<DexiePostOfferResponse | null> => {
    try {
      const result = await queryClient.fetchQuery({
        queryKey: ['dexie', 'offer', 'validation', dexieOfferId],
        queryFn: async () => {
          if (!dexieOfferId) {
            throw new Error('Dexie offer ID is required')
          }
          return await dexieRepository.inspectOfferById(dexieOfferId)
        },
        staleTime: 30000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
      })
      return result || null
    } catch {
      // Failed to validate offer state
      return null
    }
  }

  return {
    validateOfferState,
  }
}
