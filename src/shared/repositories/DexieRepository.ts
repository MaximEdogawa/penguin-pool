import { logger } from '../services/logger'

// Base configuration
const DEXIE_API_BASE_URL = import.meta.env.VITE_DEXIE_API_URL || 'https://api-testnet.dexie.space'

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

export interface DexieOfferSearchResponse {
  success: boolean
  data: unknown[]
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
  data: {
    offer_id: string
    status: string
  }
}

export interface DexieInspectOfferResponse {
  success: boolean
  data: {
    offer_id: string
    status: number
    offered: unknown[]
    requested: unknown[]
    fees: number
    date_found: string
  }
}

/**
 * Repository for all Dexie API interactions
 */
export class DexieRepository {
  private baseUrl: string

  constructor(baseUrl: string = DEXIE_API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Get all tickers (invalidates once per day)
   */
  async getAllTickers(): Promise<DexieTickerResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v3/prices/tickers`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const tickersArray = Array.isArray(data.tickers)
        ? data.tickers
        : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : []
      return {
        success: true,
        data: tickersArray,
      }
    } catch (error) {
      logger.error('Failed to fetch all tickers:', error)
      throw error
    }
  }

  /**
   * Get specific ticker by ticker_id
   */
  async getTicker(tickerId: string): Promise<DexieTickerResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v3/prices/tickers?ticker_id=${tickerId}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: Array.isArray(data.data) ? data.data : [data.data],
      }
    } catch (error) {
      logger.error('Failed to fetch ticker:', error)
      throw error
    }
  }

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
      return {
        success: true,
        data: data.data || data,
        total: data.total || 0,
        page: data.page || 1,
        page_size: data.page_size || 10,
      }
    } catch (error) {
      logger.error('Failed to search offers:', error)
      throw error
    }
  }

  /**
   * Inspect a specific offer by offer string
   */
  async inspectOffer(offerString: string): Promise<DexieInspectOfferResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offer: offerString }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Dexie API error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data,
      }
    } catch (error) {
      logger.error('Failed to inspect offer:', error)
      throw error
    }
  }

  /**
   * Get offer by ID
   */
  async getOfferById(offerId: string): Promise<DexieInspectOfferResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/offers/${offerId}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: true,
        data: data.data || data,
      }
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
        success: true,
        data: data.data || data,
      }
    } catch (error) {
      logger.error('Failed to post offer:', error)
      throw error
    }
  }
}

// Export singleton instance
export const dexieRepository = new DexieRepository()
