// Offer types for the Penguin Pool application

export interface OfferAsset {
  assetId: string
  amount: number
  type: 'xch' | 'cat' | 'nft'
  name?: string
  symbol?: string
}

export interface OfferRequest {
  walletId: number
  offer: string
  fee?: number
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
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired'
  createdAt: Date
  expiresAt?: Date
  assetsOffered: OfferAsset[]
  assetsRequested: OfferAsset[]
  fee: number
  creatorAddress: string
}

export interface CreateOfferForm {
  assetsOffered: OfferAsset[]
  assetsRequested: OfferAsset[]
  fee: number
  memo?: string
  expirationHours?: number
}

export interface OfferFilters {
  status?: string
  assetType?: string
  minAmount?: number
  maxAmount?: number
}

export interface OfferSortOptions {
  field: 'createdAt' | 'amount' | 'status' | 'expiresAt'
  direction: 'asc' | 'desc'
}
