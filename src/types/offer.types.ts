// Offer types for the Penguin Pool application

// Import shared asset types
import type { AssetAmount, AssetType, BaseAsset } from './asset.types'

export type OfferAsset = BaseAsset

export interface OfferRequest {
  walletId: number
  offer: string
  fee?: AssetAmount
}

export interface OfferResponse {
  offer: string
  tradeId: string
}

export interface TakeOfferRequest {
  offer: string
  fee?: number
}

export interface TakeOfferResponse {
  tradeId: string
  success: boolean
}

export interface CancelOfferRequest {
  tradeId: string
  fee?: number
}

export interface CancelOfferResponse {
  success: boolean
}

export interface OfferDetails {
  id: string
  tradeId: string
  offerString: string
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired' | 'failed'
  createdAt: Date
  expiresAt?: Date
  assetsOffered: OfferAsset[]
  assetsRequested: OfferAsset[]
  fee: AssetAmount
  creatorAddress?: string
}

export interface CreateOfferForm {
  assetsOffered: OfferAsset[]
  assetsRequested: OfferAsset[]
  fee: AssetAmount
  memo?: string
  expirationHours?: number
}

export interface OfferFilters {
  status?: string
  assetType?: AssetType
  minAmount?: AssetAmount
  maxAmount?: AssetAmount
}

export interface OfferSortOptions {
  field: 'createdAt' | 'amount' | 'status' | 'expiresAt'
  direction: 'asc' | 'desc'
}

// Wallet request interfaces for better type safety
export interface WalletOfferAsset {
  assetId: string
  amount: AssetAmount // Explicitly use float numbers
}

export interface CreateOfferWalletRequest {
  walletId: number
  offerAssets: WalletOfferAsset[]
  requestAssets: WalletOfferAsset[]
  fee: number
}

export interface CreateOfferWalletResponse {
  success: boolean
  offerId?: string
  data?: {
    offerId: string
    offerString: string
    fee: number
    status: string
  }
  error?: string | null
}

export interface TakeOfferWalletRequest {
  offer: string
  fee?: number
}

export interface TakeOfferWalletResponse {
  success: boolean
  tradeId?: string
  error?: string | null
}

export interface CancelOfferWalletRequest {
  offerId: string
  fee?: number
}

export interface CancelOfferWalletResponse {
  success: boolean
  error?: string | null
}
