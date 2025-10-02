import { db, type StoredOffer } from '@/shared/database/indexedDB'
import type { OfferDetails } from '@/types/offer.types'

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
      console.log('✅ Offer saved to IndexedDB:', { id, tradeId: offer.tradeId })

      return { ...storedOffer, id: id.toString() }
    } catch (error) {
      console.error('❌ Failed to save offer to IndexedDB:', error)
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

      await db.offers.update(parseInt(offerId), updateData)
      console.log('✅ Offer updated in IndexedDB:', { offerId, updates })
    } catch (error) {
      console.error('❌ Failed to update offer in IndexedDB:', error)
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
      console.log('✅ Retrieved offers from IndexedDB:', { count: offers.length })

      return offers
    } catch (error) {
      console.error('❌ Failed to get offers from IndexedDB:', error)
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
      console.log('✅ Retrieved offers by status from IndexedDB:', { status, count: offers.length })

      return offers
    } catch (error) {
      console.error('❌ Failed to get offers by status from IndexedDB:', error)
      throw error
    }
  }

  /**
   * Get a specific offer by trade ID
   */
  async getOfferByTradeId(tradeId: string): Promise<StoredOffer | undefined> {
    try {
      const offer = await db.offers.where('tradeId').equals(tradeId).first()
      console.log('✅ Retrieved offer by trade ID from IndexedDB:', { tradeId, found: !!offer })

      return offer
    } catch (error) {
      console.error('❌ Failed to get offer by trade ID from IndexedDB:', error)
      throw error
    }
  }

  /**
   * Delete an offer
   */
  async deleteOffer(offerId: string): Promise<void> {
    try {
      await db.offers.delete(parseInt(offerId))
      console.log('✅ Offer deleted from IndexedDB:', { offerId })
    } catch (error) {
      console.error('❌ Failed to delete offer from IndexedDB:', error)
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
      console.log('✅ Offers marked as synced in IndexedDB:', { count: offerIds.length })
    } catch (error) {
      console.error('❌ Failed to mark offers as synced in IndexedDB:', error)
      throw error
    }
  }

  /**
   * Get unsynced offers
   */
  async getUnsyncedOffers(): Promise<StoredOffer[]> {
    try {
      const offers = await db.offers.where('isLocal').equals(true).toArray()
      console.log('✅ Retrieved unsynced offers from IndexedDB:', { count: offers.length })

      return offers
    } catch (error) {
      console.error('❌ Failed to get unsynced offers from IndexedDB:', error)
      throw error
    }
  }

  /**
   * Clear all offers
   */
  async clearAllOffers(): Promise<void> {
    try {
      await db.offers.clear()
      console.log('✅ All offers cleared from IndexedDB')
    } catch (error) {
      console.error('❌ Failed to clear offers from IndexedDB:', error)
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

      console.log('✅ Retrieved database stats:', stats)
      return stats
    } catch (error) {
      console.error('❌ Failed to get database stats:', error)
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
