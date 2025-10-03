import { ref } from 'vue'
import { dexieRepository, type OfferState } from '../repositories/DexieRepository'

/**
 * Composable for continuous offer state validation with auto-refetch
 * Refetches every 30 seconds until the offer is cancelled
 */
export function useOfferStateValidation() {
  const activeValidations = ref(new Map<string, NodeJS.Timeout>())

  /**
   * Start continuous validation for an offer
   * Uses inspectOfferById API with the Dexie offer ID
   */
  const startValidation = async (
    dexieOfferId: string,
    onUpdate: (data: unknown) => void,
    onError: (error: Error) => void
  ) => {
    if (!dexieOfferId) {
      throw new Error('Dexie offer ID is required for validation')
    }

    // Stop any existing validation for this offer
    stopValidation(dexieOfferId)

    // Initial fetch
    try {
      const result = await dexieRepository.inspectOfferById(dexieOfferId)
      onUpdate(result)
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'))
      return
    }

    // Set up interval for continuous validation
    const interval = setInterval(async () => {
      try {
        const result = await dexieRepository.inspectOfferById(dexieOfferId)
        onUpdate(result)

        // Check if we should stop validation
        if (result && result.success && result.offer) {
          // We need to calculate the state from the offer data
          // This will be handled in the callback, so we don't need to do it here
        }
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Unknown error'))
        stopValidation(dexieOfferId)
      }
    }, 30000) // 30 seconds

    // Store the interval
    activeValidations.value.set(dexieOfferId, interval)
  }

  /**
   * Stop validation for a specific offer
   */
  const stopValidation = (dexieOfferId: string) => {
    const interval = activeValidations.value.get(dexieOfferId)
    if (interval) {
      clearInterval(interval)
      activeValidations.value.delete(dexieOfferId)
    }
  }

  /**
   * Check if validation should continue based on offer state
   * Returns true if validation should continue, false if it should stop
   */
  const shouldContinueValidation = (state: OfferState): boolean => {
    // Continue validation for these states:
    // Open, Pending, Cancelling
    // Stop validation for: Cancelled, Completed, Unknown, Expired
    return state === 'Open' || state === 'Pending' || state === 'Cancelling'
  }

  /**
   * Check if validation is active for an offer
   */
  const isValidationActive = (dexieOfferId: string): boolean => {
    return activeValidations.value.has(dexieOfferId)
  }

  /**
   * Stop all active validations
   */
  const stopAllValidations = () => {
    activeValidations.value.forEach(interval => {
      clearInterval(interval)
    })
    activeValidations.value.clear()
  }

  return {
    startValidation,
    stopValidation,
    shouldContinueValidation,
    isValidationActive,
    stopAllValidations,
  }
}
