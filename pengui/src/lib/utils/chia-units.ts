/**
 * Chia unit conversion utilities
 * 1 XCH = 1,000,000,000,000 mojos
 */

const MOJOS_PER_XCH = 1_000_000_000_000

/**
 * Convert XCH amount to mojos
 */
export function xchToMojos(xchAmount: number): number {
  return Math.floor(xchAmount * MOJOS_PER_XCH)
}

/**
 * Convert mojos to XCH amount
 */
export function mojosToXch(mojosAmount: number | string): number {
  const mojos = typeof mojosAmount === 'string' ? BigInt(mojosAmount) : BigInt(mojosAmount)
  return Number(mojos) / MOJOS_PER_XCH
}

/**
 * Get minimum fee in mojos (0.000001 XCH)
 */
export function getMinimumFeeInMojos(): number {
  return xchToMojos(0.000001)
}

/**
 * Get minimum fee in XCH
 */
export function getMinimumFeeInXch(): number {
  return 0.000001
}

/**
 * Validate Chia address format
 */
export function isValidChiaAddress(address: string): boolean {
  const chiaAddressRegex = /^(xch|txch)1[a-z0-9]{58}$/
  return chiaAddressRegex.test(address.trim())
}
