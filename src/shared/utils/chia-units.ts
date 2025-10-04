/**
 * Chia unit conversion utilities
 *
 * Chia uses mojos as the base unit:
 * - 1 XCH = 1,000,000,000,000 mojos (1 trillion mojos)
 * - 1 mojo = 0.000000000001 XCH
 */

// Import asset types for better type safety
import type { AssetAmount, AssetType } from '@/types/asset.types'

// Constants for Chia unit conversion
export const MOJOS_PER_XCH = 1_000_000_000_000
export const XCH_PER_MOJO = 1 / MOJOS_PER_XCH

/**
 * Convert XCH amount to mojos
 * @param xchAmount - Amount in XCH
 * @returns Amount in mojos (rounded to nearest integer)
 */
export function xchToMojos(xchAmount: AssetAmount): number {
  return Math.round(xchAmount * MOJOS_PER_XCH)
}

/**
 * Convert mojos amount to XCH
 * @param mojosAmount - Amount in mojos
 * @returns Amount in XCH
 */
export function mojosToXch(mojosAmount: number): AssetAmount {
  return mojosAmount * XCH_PER_MOJO
}

/**
 * Format XCH amount for display with proper precision
 * @param xchAmount - Amount in XCH
 * @param precision - Number of decimal places (default: 6)
 * @returns Formatted string
 */
export function formatXchAmount(xchAmount: AssetAmount, precision: number = 6): string {
  // Ensure amount is a number
  const numAmount = typeof xchAmount === 'string' ? parseFloat(xchAmount) : xchAmount

  // Handle invalid numbers
  if (isNaN(numAmount)) {
    return '0'.padEnd(precision + 2, '0') // Return "0.000000" for 6 precision
  }

  return numAmount.toFixed(precision)
}

/**
 * Format mojos amount for display as XCH
 * @param mojosAmount - Amount in mojos
 * @param precision - Number of decimal places (default: 6)
 * @returns Formatted string
 */
export function formatMojosAsXch(mojosAmount: number, precision: number = 6): string {
  return formatXchAmount(mojosToXch(mojosAmount), precision)
}

/**
 * Validate that an XCH amount is within valid range
 * @param xchAmount - Amount in XCH
 * @returns true if valid, false otherwise
 */
export function isValidXchAmount(xchAmount: AssetAmount): boolean {
  return xchAmount >= 0 && xchAmount <= Number.MAX_SAFE_INTEGER / MOJOS_PER_XCH
}

/**
 * Get the minimum fee in mojos (0.000001 XCH)
 * @returns Minimum fee in mojos
 */
export function getMinimumFeeInMojos(): number {
  return xchToMojos(0.000001)
}

/**
 * Get the minimum fee in XCH
 * @returns Minimum fee in XCH
 */
export function getMinimumFeeInXch(): AssetAmount {
  return 0.000001
}

/**
 * Format asset amount for display based on asset type
 * @param amount - Amount to format
 * @param assetType - Type of asset ('xch', 'cat', 'nft')
 * @param precision - Number of decimal places for XCH (default: 6)
 * @returns Formatted string
 */
export function formatAssetAmount(
  amount: AssetAmount,
  assetType: AssetType,
  precision: number = 6
): string {
  // Ensure amount is a number
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  // Handle invalid numbers
  if (isNaN(numAmount)) {
    return '0'
  }

  switch (assetType.toLowerCase()) {
    case 'xch':
      return formatXchAmount(numAmount, precision)
    case 'cat':
      // CAT tokens can have decimal places, show 3 decimal places for precision
      return numAmount.toFixed(3)
    case 'nft':
      // NFTs are whole numbers
      return Math.floor(numAmount).toString()
    default:
      // Default to 2 decimal places for unknown tokens
      return numAmount.toFixed(2)
  }
}

/**
 * Format asset amount with ticker symbol for display
 * @param amount - Amount to format
 * @param assetId - Asset ID to get ticker symbol for
 * @param assetType - Type of asset ('xch', 'cat', 'nft')
 * @param precision - Number of decimal places for XCH (default: 6)
 * @returns Formatted string with ticker symbol
 */
export function formatAssetAmountWithTicker(
  amount: AssetAmount,
  assetId: string,
  assetType: AssetType,
  precision: number = 6
): string {
  const formattedAmount = formatAssetAmount(amount, assetType, precision)

  // For XCH, always show XCH
  if (assetType.toLowerCase() === 'xch') {
    return `${formattedAmount} XCH`
  }

  // For other assets, we'll need to get the ticker symbol from the mapping
  // This will be enhanced when the ticker mapping is available
  return `${formattedAmount} ${assetId.slice(0, 8)}...`
}

/**
 * Format asset amount from smallest unit to display unit
 * @param amount - Amount in smallest unit (mojos for XCH, whole units for CAT/NFT)
 * @param assetType - Type of asset ('xch', 'cat', 'nft')
 * @param precision - Number of decimal places for XCH (default: 6)
 * @returns Formatted string
 */
export function formatAssetAmountFromSmallestUnit(
  amount: AssetAmount,
  assetType: AssetType,
  precision: number = 6
): string {
  // Ensure amount is a number
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  // Handle invalid numbers
  if (isNaN(numAmount)) {
    return '0'
  }

  switch (assetType.toLowerCase()) {
    case 'xch':
      return formatMojosAsXch(numAmount, precision)
    case 'cat':
      // CAT tokens can have decimal places, show 3 decimal places for precision
      return numAmount.toFixed(3)
    case 'nft':
      // NFTs are already in whole units
      return Math.floor(numAmount).toString()
    default:
      // Default to 2 decimal places for unknown tokens
      return numAmount.toFixed(2)
  }
}
