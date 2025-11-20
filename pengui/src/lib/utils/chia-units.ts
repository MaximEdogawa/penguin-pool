/**
 * Chia unit conversion utilities
 *
 * Chia uses mojos as the base unit:
 * - 1 XCH = 1,000,000,000,000 mojos (1 trillion mojos)
 * - 1 mojo = 0.000000000001 XCH
 *
 * CAT tokens use whole units (no standard smallest unit like mojos)
 */

import type { AssetAmount, AssetType } from '@/types/offer.types'

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
export function mojosToXch(mojosAmount: number | string | bigint): AssetAmount {
  const mojos =
    typeof mojosAmount === 'string'
      ? BigInt(mojosAmount)
      : typeof mojosAmount === 'bigint'
        ? mojosAmount
        : BigInt(mojosAmount)
  return Number(mojos) * XCH_PER_MOJO
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
export function formatMojosAsXch(
  mojosAmount: number | string | bigint,
  precision: number = 6
): string {
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
 * Validate Chia address format
 * @param address - Chia address to validate
 * @returns true if valid, false otherwise
 */
export function isValidChiaAddress(address: string): boolean {
  const chiaAddressRegex = /^(xch|txch)1[a-z0-9]{58}$/
  return chiaAddressRegex.test(address.trim())
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
 * @param assetType - Type of asset ('xch', 'cat', 'nft')
 * @param ticker - Optional ticker symbol
 * @param precision - Number of decimal places for XCH (default: 6)
 * @returns Formatted string with ticker symbol
 */
export function formatAssetAmountWithTicker(
  amount: AssetAmount,
  assetType: AssetType,
  ticker?: string,
  precision: number = 6
): string {
  const formattedAmount = formatAssetAmount(amount, assetType, precision)

  // For XCH, always show XCH
  if (assetType.toLowerCase() === 'xch') {
    return `${formattedAmount} XCH`
  }

  // For other assets, use ticker if provided
  if (ticker) {
    return `${formattedAmount} ${ticker}`
  }

  return formattedAmount
}

/**
 * Format asset amount from smallest unit to display unit
 * @param amount - Amount in smallest unit (mojos for XCH, whole units for CAT/NFT)
 * @param assetType - Type of asset ('xch', 'cat', 'nft')
 * @param precision - Number of decimal places for XCH (default: 6)
 * @returns Formatted string
 */
export function formatAssetAmountFromSmallestUnit(
  amount: number | string | bigint,
  assetType: AssetType,
  precision: number = 6
): string {
  // Ensure amount is a number
  const numAmount =
    typeof amount === 'string'
      ? parseFloat(amount)
      : typeof amount === 'bigint'
        ? Number(amount)
        : amount

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

/**
 * Convert amount to smallest unit based on asset type
 * @param amount - Amount in display units
 * @param assetType - Type of asset ('xch', 'cat', 'nft')
 * @returns Amount in smallest unit
 */
export function convertToSmallestUnit(amount: AssetAmount, assetType: AssetType): number {
  switch (assetType.toLowerCase()) {
    case 'xch':
      return xchToMojos(amount)
    case 'cat':
      // CAT tokens need conversion to smallest unit (1 CAT = 1000 smallest units)
      // This ensures 1:1 mapping: user inputs 1, wallet shows 1
      return Math.round(amount * 1000)
    case 'nft':
      // NFTs are whole numbers
      return Math.floor(amount)
    default:
      // Default to exact amount for unknown tokens
      return amount
  }
}

/**
 * Convert amount from smallest unit to display unit based on asset type
 * @param amount - Amount in smallest unit
 * @param assetType - Type of asset ('xch', 'cat', 'nft')
 * @returns Amount in display units
 */
export function convertFromSmallestUnit(
  amount: number | string | bigint,
  assetType: AssetType
): AssetAmount {
  switch (assetType.toLowerCase()) {
    case 'xch':
      return mojosToXch(amount)
    case 'cat':
      // CAT tokens: convert from smallest unit (divide by 1000)
      // This ensures 1:1 mapping: wallet shows 1, user sees 1
      const catAmount =
        typeof amount === 'string'
          ? parseFloat(amount)
          : typeof amount === 'bigint'
            ? Number(amount)
            : amount
      return catAmount / 1000
    case 'nft':
      // NFTs are whole numbers
      return typeof amount === 'string'
        ? parseFloat(amount)
        : typeof amount === 'bigint'
          ? Number(amount)
          : amount
    default:
      // Default to exact amount for unknown tokens
      return typeof amount === 'string'
        ? parseFloat(amount)
        : typeof amount === 'bigint'
          ? Number(amount)
          : amount
  }
}

/**
 * Validate input value for amount field
 * Allows empty string, numbers, and decimal point
 * @param value - Input value to validate
 * @returns true if valid input format
 */
export function isValidAmountInput(value: string): boolean {
  return value === '' || /^\d*\.?\d*$/.test(value)
}

/**
 * Parse amount input value to number
 * Handles empty string, decimal point, and invalid values
 * @param value - Input value to parse
 * @returns Parsed number or 0 if invalid
 */
export function parseAmountInput(value: string): AssetAmount {
  if (value === '' || value === '.') {
    return 0
  }
  const parsed = parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Get placeholder text for amount input based on asset type
 * @param assetType - Type of asset ('xch', 'cat', 'nft')
 * @returns Placeholder text
 */
export function getAmountPlaceholder(assetType: AssetType): string {
  switch (assetType.toLowerCase()) {
    case 'xch':
      return '0.000000'
    case 'cat':
      return '0.000'
    case 'nft':
      return '0'
    default:
      return '0.00'
  }
}

/**
 * Get step value for amount input based on asset type
 * @param assetType - Type of asset ('xch', 'cat', 'nft')
 * @returns Step value for input
 */
export function getAmountStep(assetType: AssetType): string {
  switch (assetType.toLowerCase()) {
    case 'xch':
      return '0.000001'
    case 'cat':
      return '0.001'
    case 'nft':
      return '1'
    default:
      return '0.01'
  }
}
