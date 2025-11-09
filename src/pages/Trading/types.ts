// Shared types for trading components
export interface AssetItem {
  assetId: string
  amount: number
  type: 'xch' | 'cat' | 'nft'
  symbol: string
  searchQuery: string
  showDropdown: boolean
}

export interface DexieAssetItem {
  id: string
  code: string
  name: string
  amount: number
}

export interface OrderBookOrder {
  id: string
  offering: DexieAssetItem[]
  receiving: DexieAssetItem[]
  maker: string
  timestamp: string
  offeringUsdValue: number
  receivingUsdValue: number
  offeringXchValue: number
  receivingXchValue: number
  pricePerUnit: number
  status: number
  date_found: string
  date_completed?: string | null
  date_pending?: string | null
  date_expiry?: string | null
  known_taker?: unknown | null
  offerString?: string
  creatorAddress?: string
}

export interface Trade {
  id: string
  sellAssets: DexieAssetItem[]
  buyAssets: DexieAssetItem[]
  status: string
  maker: string
  timestamp: string
  date_found: string
  date_completed?: string | null
  date_pending?: string | null
  date_expiry?: string | null
  known_taker?: unknown | null
}

export interface FilterState {
  buyAsset: string[]
  sellAsset: string[]
  status?: string[]
  [key: string]: string[] | undefined
}

export interface SuggestionItem {
  value: string
  column: string
  label: string
}

export interface OfferSubmitData {
  offeringAssets: Array<{ assetId: string; amount: number; type: string; symbol: string }>
  requestedAssets: Array<{ assetId: string; amount: number; type: string; symbol: string }>
  priceAdjustment: number
  mode: 'maker' | 'taker'
}
