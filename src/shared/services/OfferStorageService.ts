import { db, type StoredOffer } from '@/shared/database/indexedDB'
import type { OfferDetails } from '@/types/offer.types'
import { logger } from './logger'

export interface OfferStorageOptions {
  walletAddress?: string
  includeLocal?: boolean
  includeSynced?: boolean
}

export class OfferStorageService {
  /**
   * Save an offer to IndexedDB
   */
  async saveOffer(
    offer: OfferDetails,
    isLocal: boolean = true,
    walletAddress?: string
  ): Promise<StoredOffer> {
    try {
      const storedOffer: StoredOffer = {
        ...offer,
        lastModified: new Date(),
        isLocal,
        walletAddress: walletAddress || this.getCurrentWalletAddress(),
        syncedAt: isLocal ? undefined : new Date(),
      }

      const id = await db.offers.add(storedOffer)
      logger.info('✅ Offer saved to IndexedDB:', { id, offerId: offer.id, tradeId: offer.tradeId })

      // Return the stored offer with the original offer ID (not the IndexedDB auto-generated ID)
      return { ...storedOffer, id: offer.id }
    } catch (error) {
      logger.error('❌ Failed to save offer to IndexedDB:', error)
      throw error
    }
  }

  /**
   * Update an existing offer
   */
  async updateOffer(offerId: string, updates: Partial<OfferDetails>): Promise<void> {
    try {
      const updateData: Partial<StoredOffer> = {
        ...updates,
        lastModified: new Date(),
      }

      // Update by the offerId field (not the auto-generated primary key)
      const updatedCount = await db.offers.where('id').equals(offerId).modify(updateData)

      if (updatedCount === 0) {
        throw new Error(`No offer found with ID: ${offerId}`)
      }

      logger.info('✅ Offer updated in IndexedDB:', { offerId, updates, updatedCount })
    } catch (error) {
      logger.error('❌ Failed to update offer in IndexedDB:', error)
      throw error
    }
  }

  /**
   * Get all offers with optional filtering
   */
  async getOffers(options: OfferStorageOptions = {}): Promise<StoredOffer[]> {
    try {
      let query = db.offers.orderBy('lastModified').reverse()

      // Filter by wallet address if provided
      if (options.walletAddress) {
        query = query.filter(offer => offer.walletAddress === options.walletAddress)
      }

      // Filter by local/synced status
      if (options.includeLocal === false) {
        query = query.filter(offer => !offer.isLocal)
      }
      if (options.includeSynced === false) {
        query = query.filter(offer => offer.isLocal)
      }

      const offers = await query.toArray()
      logger.info('✅ Retrieved offers from IndexedDB:', { count: offers.length })

      return offers
    } catch (error) {
      logger.error('❌ Failed to get offers from IndexedDB:', error)
      throw error
    }
  }

  /**
   * Get offers by status
   */
  async getOffersByStatus(status: string, walletAddress?: string): Promise<StoredOffer[]> {
    try {
      let query = db.offers.where('status').equals(status)

      if (walletAddress) {
        query = query.and(offer => offer.walletAddress === walletAddress)
      }

      const offers = await query.reverse().sortBy('lastModified')
      logger.info('✅ Retrieved offers by status from IndexedDB:', { status, count: offers.length })

      return offers
    } catch (error) {
      logger.error('❌ Failed to get offers by status from IndexedDB:', error)
      throw error
    }
  }

  /**
   * Get a specific offer by trade ID
   */
  async getOfferByTradeId(tradeId: string): Promise<StoredOffer | undefined> {
    try {
      const offer = await db.offers.where('tradeId').equals(tradeId).first()
      logger.info('✅ Retrieved offer by trade ID from IndexedDB:', { tradeId, found: !!offer })

      return offer
    } catch (error) {
      logger.error('❌ Failed to get offer by trade ID from IndexedDB:', error)
      throw error
    }
  }

  /**
   * Delete an offer
   */
  async deleteOffer(offerId: string): Promise<void> {
    try {
      const deletedCount = await db.offers.where('id').equals(offerId).delete()

      if (deletedCount === 0) {
        throw new Error(`No offer found with ID: ${offerId}`)
      }

      logger.info('✅ Offer deleted from IndexedDB:', { offerId, deletedCount })
    } catch (error) {
      logger.error('❌ Failed to delete offer from IndexedDB:', error)
      throw error
    }
  }

  /**
   * Mark offers as synced
   */
  async markOffersAsSynced(offerIds: string[]): Promise<void> {
    try {
      const updates = offerIds.map(id => ({
        key: parseInt(id),
        changes: {
          isLocal: false,
          syncedAt: new Date(),
          lastModified: new Date(),
        },
      }))

      await db.offers.bulkUpdate(updates)
      logger.info('✅ Offers marked as synced in IndexedDB:', { count: offerIds.length })
    } catch (error) {
      logger.error('❌ Failed to mark offers as synced in IndexedDB:', error)
      throw error
    }
  }

  /**
   * Get unsynced offers
   */
  async getUnsyncedOffers(): Promise<StoredOffer[]> {
    try {
      const offers = await db.offers.filter(offer => offer.isLocal).toArray()
      logger.info('✅ Retrieved unsynced offers from IndexedDB:', { count: offers.length })

      return offers
    } catch (error) {
      logger.error('❌ Failed to get unsynced offers from IndexedDB:', error)
      throw error
    }
  }

  /**
   * Clear all offers
   */
  async clearAllOffers(): Promise<void> {
    try {
      await db.offers.clear()
      logger.info('✅ All offers cleared from IndexedDB')
    } catch (error) {
      logger.error('❌ Failed to clear offers from IndexedDB:', error)
      throw error
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalOffers: number
    localOffers: number
    syncedOffers: number
    statusBreakdown: Record<string, number>
  }> {
    try {
      const allOffers = await db.offers.toArray()

      const stats = {
        totalOffers: allOffers.length,
        localOffers: allOffers.filter(o => o.isLocal).length,
        syncedOffers: allOffers.filter(o => !o.isLocal).length,
        statusBreakdown: allOffers.reduce(
          (acc, offer) => {
            acc[offer.status] = (acc[offer.status] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ),
      }

      logger.info('✅ Retrieved database stats:', stats)
      return stats
    } catch (error) {
      logger.error('❌ Failed to get database stats:', error)
      throw error
    }
  }

  /**
   * Get current wallet address from session
   * Note: This method cannot use Vue composables since it's called outside Vue context
   */
  private getCurrentWalletAddress(): string | undefined {
    // Return undefined - wallet address should be passed as parameter
    // when calling saveOffer from Vue components
    return undefined
  }
}

// Create singleton instance
export const offerStorageService = new OfferStorageService()
