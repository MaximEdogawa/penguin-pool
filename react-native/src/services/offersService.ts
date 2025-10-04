/**
 * API Service for Offers Operations
 * Handles offer creation, management, and related operations
 */

import { env } from '../shared/config/env'
import { logger } from '../shared/services/logger'
import type {
  CancelOfferRequest,
  OfferDetails,
  OfferFilters,
  OfferRequest,
  TakeOfferRequest,
} from '../shared/types'

export interface OffersService {
  getOffers: (filters?: OfferFilters) => Promise<OfferDetails[]>
  createOffer: (request: OfferRequest) => Promise<OfferDetails>
  takeOffer: (request: TakeOfferRequest) => Promise<string>
  cancelOffer: (request: CancelOfferRequest) => Promise<void>
  getOfferById: (id: string) => Promise<OfferDetails | null>
}

class OffersApiService implements OffersService {
  private baseUrl: string
  private timeout: number

  constructor() {
    this.baseUrl = env.API_BASE_URL
    this.timeout = env.API_TIMEOUT
  }

  async getOffers(_filters?: OfferFilters): Promise<OfferDetails[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(_filters || {}),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch offers: ${response.statusText}`)
      }

      const data = await response.json()
      return data.offers || []
    } catch (_error) {
      logger.error('Failed to fetch offers', _error as Error)
      return []
    }
  }

  async createOffer(_request: OfferRequest): Promise<OfferDetails> {
    try {
      const response = await fetch(`${this.baseUrl}/api/offers/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(_request),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`Failed to create offer: ${response.statusText}`)
      }

      const data = await response.json()
      return data.offer
    } catch (_error) {
      logger.error('Failed to create offer', _error as Error)
      throw _error
    }
  }

  async takeOffer(_request: TakeOfferRequest): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/offers/take`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(_request),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`Failed to take offer: ${response.statusText}`)
      }

      const data = await response.json()
      return data.transactionId
    } catch (_error) {
      logger.error('Failed to take offer', _error as Error)
      throw _error
    }
  }

  async cancelOffer(_request: CancelOfferRequest): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/offers/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(_request),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new Error(`Failed to cancel offer: ${response.statusText}`)
      }
    } catch (_error) {
      logger.error('Failed to cancel offer', _error as Error)
      throw _error
    }
  }

  async getOfferById(_id: string): Promise<OfferDetails | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/offers/${_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to fetch offer: ${response.statusText}`)
      }

      const data = await response.json()
      return data.offer
    } catch (_error) {
      logger.error('Failed to fetch offer by ID', _error as Error)
      return null
    }
  }
}

// Export singleton instance
export const offersService = new OffersApiService()
