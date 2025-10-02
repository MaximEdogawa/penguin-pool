// Asset types for the Penguin Pool application
// This file defines types for handling different asset types with float precision

// Core asset types
export type AssetAmount = number // Always use float numbers for precision
export type AssetType = 'xch' | 'cat' | 'nft'

// Asset precision configuration
export interface AssetPrecision {
  xch: 12 // XCH shows 6 decimal places
  cat: 3 // CAT tokens show 3 decimal places
  nft: 0 // NFTs are whole numbers
}

// Asset formatting configuration
export const ASSET_PRECISION: AssetPrecision = {
  xch: 12,
  cat: 3,
  nft: 0,
} as const

// Base asset interface
export interface BaseAsset {
  assetId: string
  amount: AssetAmount
  type: AssetType
  symbol?: string
  name?: string
}

// Asset conversion utilities type
export interface AssetConversion {
  toSmallestUnit: (amount: AssetAmount, assetType: AssetType) => AssetAmount
  fromSmallestUnit: (amount: AssetAmount, assetType: AssetType) => AssetAmount
  formatForDisplay: (amount: AssetAmount, assetType: AssetType) => string
}

// Asset validation type
export interface AssetValidation {
  isValidAmount: (amount: AssetAmount, assetType: AssetType) => boolean
  isValidAssetId: (assetId: string, assetType: AssetType) => boolean
}

// Input field configuration for different asset types
export interface AssetInputConfig {
  step: number
  min: number
  max?: number
  placeholder: string
}

export const ASSET_INPUT_CONFIG: Record<AssetType, AssetInputConfig> = {
  xch: {
    step: 0.000000000001,
    min: 0,
    placeholder: '0.000000',
  },
  cat: {
    step: 0.001,
    min: 0,
    placeholder: '0.000',
  },
  nft: {
    step: 1,
    min: 1,
    placeholder: '1',
  },
} as const

// Type guards for asset validation
export function isAssetType(type: string): type is AssetType {
  return ['xch', 'cat', 'nft'].includes(type)
}

export function isValidAssetAmount(amount: AssetAmount, assetType: AssetType): boolean {
  const config = ASSET_INPUT_CONFIG[assetType]
  return amount >= config.min && (config.max === undefined || amount <= config.max)
}

// Utility type for asset operations
export type AssetOperation = 'offer' | 'request' | 'send' | 'receive'
