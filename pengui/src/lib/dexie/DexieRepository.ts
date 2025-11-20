import { environment } from '@/lib/config/environment'
import { logger } from '@/lib/logger'
import type { OfferState } from '@/types/offer.types'

// Base configuration
const DEXIE_API_BASE_URL = environment.dexie.apiBaseUrl

// Types for Dexie API responses
export interface DexieTicker {
  ticker_id: string
  base_currency: string
  target_currency: string
  base_code: string
  target_code: string
  base_name: string
  target_name: string
  last_price: number
  current_avg_price: number
  base_volume: number
  target_volume: number
  base_volume_7d: number
  target_volume_7d: number
  base_volume_30d: number
  target_volume_30d: number
  pool_id: string
  bid: number | null
  ask: number | null
  high: number | null
  low: number | null
  high_7d: number | null
  low_7d: number | null
  high_30d: number | null
  low_30d: number | null
}

export interface DexieTickerResponse {
  success: boolean
  data: DexieTicker[]
}

export interface DexiePair {
  pair_id: string
  base_asset: string
  quote_asset: string
  last_price: number
  base_volume: number
  quote_volume: number
}

export interface DexiePairsResponse {
  success: boolean
  data: DexiePair[]
}

export interface DexieOrderBookEntry {
  price: number
  volume: number
}

export interface DexieOrderBook {
  ticker_id: string
  bids: DexieOrderBookEntry[]
  asks: DexieOrderBookEntry[]
}

export interface DexieOrderBookResponse {
  success: boolean
  data: DexieOrderBook
}

export interface DexieHistoricalTrade {
  trade_id: string
  ticker_id: string
  price: number
  volume: number
  timestamp: number
  side: 'buy' | 'sell'
}

export interface DexieHistoricalTradesResponse {
  success: boolean
  data: DexieHistoricalTrade[]
}

export interface DexieOfferSearchParams {
  requested?: string
  offered?: string
  maker?: string
  page_size?: number
  page?: number
  status?: number
}

export interface DexieAsset {
  id: string
  code: string
  name: string
  amount: number
}

export interface DexieOffer {
  id: string
  status: number // Legacy field - we'll calculate state from dates instead
  offer?: string // Original offer string (available in POST responses)
  date_found: string
  date_completed?: string | null
  date_pending?: string | null
  date_expiry?: string | null
  block_expiry?: number | null
  spent_block_index?: number | null
  price: number
  offered: DexieAsset[]
  requested: DexieAsset[]
  fees: number
  known_taker?: unknown | null // null = cancelled, not null = completed
}

export interface DexieOfferSearchResponse {
  success: boolean
  data: DexieOffer[] | unknown[]
  total: number
  page: number
  page_size: number
}

export interface DexiePostOfferParams {
  offer: string
  drop_only?: boolean
  claim_rewards?: boolean
}

export interface DexiePostOfferResponse {
  success: boolean
  id: string
  known: boolean
  offer: DexieOffer | null
  error_message?: string
}

/**
 * Calculate offer state based on date fields and known_taker according to the specified logic:
 * - Completed: if date_completed exists AND known_taker is not null
 * - Cancelled: if known_taker is null OR spent_block_index exists
 * - Pending: if date_pending exists
 * - Expired: if date_expiry or block_expiry after date_found
 * - Open: if there is a date_found but no completed date or date_found is smaller than date_expiry
 * - Unknown: if every date is null
 */
export function calculateOfferState(offer: DexieOffer): OfferState {
  // Extract and normalize data
  const dateFound = offer.date_found ? new Date(offer.date_found) : null
  const dateCompleted = offer.date_completed ? new Date(offer.date_completed) : null
  const datePending = offer.date_pending ? new Date(offer.date_pending) : null
  const dateExpiry = offer.date_expiry ? new Date(offer.date_expiry) : null
  const blockExpiry = offer.block_expiry
  const spentBlockIndex = offer.spent_block_index
  const knownTaker = offer.known_taker

  const hasValidKnownTaker = knownTaker !== null && knownTaker !== undefined
  const hasValidSpentBlockIndex = spentBlockIndex !== null && spentBlockIndex !== undefined
  const hasValidBlockExpiry = blockExpiry !== null && blockExpiry !== undefined

  // 1. COMPLETED: date_completed exists AND known_taker is not null
  if (dateCompleted && hasValidKnownTaker) return 'Completed'

  // 2. CANCELLED: spent_block_index exists (coin was spent, offer cancelled)
  if (hasValidSpentBlockIndex) return 'Cancelled'

  // 3. PENDING: date_pending exists but no date_found yet
  if (datePending && !dateFound) return 'Pending'

  // 4. EXPIRED: date_expiry is before date_found OR block_expiry exists
  if (dateExpiry && dateFound && dateExpiry < dateFound) return 'Expired'
  if (hasValidBlockExpiry) return 'Expired'

  // 5. OPEN: date_found exists, no completion, no spending, within expiry (if any)
  if (dateFound && !dateCompleted) {
    const isWithinExpiry = !dateExpiry || dateFound < dateExpiry
    if (isWithinExpiry) return 'Open'
  }

  return 'Unknown'
}

/**
 * Helper function to check if an offer state indicates completion
 */
export function isOfferCompleted(state: OfferState): boolean {
  return state === 'Completed'
}

/**
 * Helper function to check if an offer state indicates cancellation
 */
export function isOfferCancelled(state: OfferState): boolean {
  return state === 'Cancelled'
}

/**
 * Helper function to check if an offer state indicates it's still active
 */
export function isOfferActive(state: OfferState): boolean {
  return state === 'Open' || state === 'Pending'
}

/**
 * Helper function to check if an offer state indicates it's finalized
 */
export function isOfferFinalized(state: OfferState): boolean {
  return state === 'Completed' || state === 'Cancelled' || state === 'Expired'
}

/**
 * Repository for all Dexie API interactions
 */
export class DexieRepository {
  private baseUrl: string

  constructor(baseUrl: string = DEXIE_API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  // getAllTickers and getTicker removed - use TanStack Query hooks from useTickers.ts instead

  /**
   * Get all trading pairs
   */
  async getAllPairs(): Promise<DexiePairsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v3/prices/pairs`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data,
      }
    } catch (error) {
      logger.error('Failed to fetch all pairs:', error)
      throw error
    }
  }

  /**
   * Get order book for a specific ticker
   */
  async getOrderBook(tickerId: string, depth: number = 10): Promise<DexieOrderBookResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v3/prices/orderbook?ticker_id=${tickerId}&depth=${depth}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data,
      }
    } catch (error) {
      logger.error('Failed to fetch order book:', error)
      throw error
    }
  }

  /**
   * Get historical trades for a ticker
   */
  async getHistoricalTrades(
    tickerId: string,
    limit: number = 100
  ): Promise<DexieHistoricalTradesResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v3/prices/trades?ticker_id=${tickerId}&limit=${limit}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data,
      }
    } catch (error) {
      logger.error('Failed to fetch historical trades:', error)
      throw error
    }
  }

  /**
   * Search for offers
   */
  async searchOffers(params: DexieOfferSearchParams = {}): Promise<DexieOfferSearchResponse> {
    try {
      const queryParams = new URLSearchParams()

      if (params.requested) queryParams.append('requested', params.requested)
      if (params.offered) queryParams.append('offered', params.offered)
      if (params.maker) queryParams.append('maker', params.maker)
      if (params.page_size) queryParams.append('page_size', params.page_size.toString())
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.status !== undefined) queryParams.append('status', params.status.toString())

      const response = await fetch(`${this.baseUrl}/v1/offers?${queryParams.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Handle different response structures
      let offersData: unknown[] = []
      if (Array.isArray(data)) {
        // Direct array response
        offersData = data
      } else if (data && typeof data === 'object') {
        // Object response - check for nested arrays
        if (Array.isArray(data.data)) {
          offersData = data.data
        } else if (Array.isArray(data.offers)) {
          offersData = data.offers
        } else if (Array.isArray(data.results)) {
          offersData = data.results
        }
      }

      return {
        success: true,
        data: offersData,
        total: data.total || offersData.length,
        page: data.page || 1,
        page_size: data.page_size || 10,
      }
    } catch (error) {
      logger.error('Failed to search offers:', error)
      throw error
    }
  }

  /**
   * Inspect offer by ID
   */
  async inspectOfferById(id: string): Promise<DexiePostOfferResponse> {
    try {
      logger.info(`Fetching offer by ID: ${id}`)
      const response = await fetch(`${this.baseUrl}/v1/offers/${id}`)

      const result = await response.json()
      logger.info(`Response status: ${response.status}, Result:`, result)

      if (!response.ok) {
        logger.warn(`Offer not found or expired for ID ${id}:`, result)
        // Return the error response in DexiePostOfferResponse format
        return {
          success: false,
          id: id,
          known: false,
          offer: null,
          error_message: result.error_message || `HTTP error! status: ${response.status}`,
        } as DexiePostOfferResponse
      }

      const responseData = {
        success: result.success,
        id: result.offer?.id || id,
        known: true, // GET requests are always "known" since we're fetching by ID
        offer: result.offer,
      }
      logger.info(`Returning successful response:`, responseData)
      return responseData
    } catch (error) {
      logger.error('Failed to fetch offer by ID:', error)
      throw error
    }
  }

  /**
   * Post an offer to Dexie
   */
  async postOffer(params: DexiePostOfferParams): Promise<DexiePostOfferResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Dexie API error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return {
        success: data.success,
        id: data.id,
        known: data.known,
        offer: data.offer,
      }
    } catch (error) {
      logger.error('Failed to post offer:', error)
      throw error
    }
  }
}

// Export singleton instance
export const dexieRepository = new DexieRepository()
