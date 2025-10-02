/**
 * Chia unit conversion utilities
 *
 * Chia uses mojos as the base unit:
 * - 1 XCH = 1,000,000,000,000 mojos (1 trillion mojos)
 * - 1 mojo = 0.000000000001 XCH
 */

// Constants for Chia unit conversion
export const MOJOS_PER_XCH = 1_000_000_000_000
export const XCH_PER_MOJO = 1 / MOJOS_PER_XCH

/**
 * Convert XCH amount to mojos
 * @param xchAmount - Amount in XCH
 * @returns Amount in mojos (rounded to nearest integer)
 */
export function xchToMojos(xchAmount: number): number {
  return Math.round(xchAmount * MOJOS_PER_XCH)
}

/**
 * Convert mojos amount to XCH
 * @param mojosAmount - Amount in mojos
 * @returns Amount in XCH
 */
export function mojosToXch(mojosAmount: number): number {
  return mojosAmount * XCH_PER_MOJO
}

/**
 * Format XCH amount for display with proper precision
 * @param xchAmount - Amount in XCH
 * @param precision - Number of decimal places (default: 6)
 * @returns Formatted string
 */
export function formatXchAmount(xchAmount: number, precision: number = 6): string {
  return xchAmount.toFixed(precision)
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
export function isValidXchAmount(xchAmount: number): boolean {
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
export function getMinimumFeeInXch(): number {
  return 0.000001
}
