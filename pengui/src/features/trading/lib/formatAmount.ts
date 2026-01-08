/**
 * Format amount utilities for order book
 * Compact formatting that only truncates when necessary
 */

/**
 * Format amount for display - preserves full precision, only truncates if decimals are excessive (>12)
 * CSS truncate class handles responsive visual truncation based on available space
 */
export function formatAmountForDisplay(amount: number): string {
  if (amount === 0) return '0'
  if (amount < 0.000001) return amount.toExponential(2)

  const str = amount.toString()
  const [int, dec] = str.split('.')

  // Only programmatically truncate if decimals are excessive (>12)
  // Otherwise show full value - CSS will handle responsive truncation
  if (dec && dec.length > 12) {
    // Only truncate if decimals exceed 12 places
    const truncated = dec.slice(0, 12)
    // Remove trailing zeros from truncated part
    const trimmedTruncated = truncated.replace(/0+$/, '')
    return trimmedTruncated ? `${int}.${trimmedTruncated}…` : `${int}…`
  }

  // Show full value without truncation - preserve original precision
  // Remove trailing zeros for cleaner display, but keep all significant digits
  if (!dec) {
    return int
  }

  // Remove trailing zeros but keep all significant decimal places
  const trimmedDecimal = dec.replace(/0+$/, '')
  return trimmedDecimal ? `${int}.${trimmedDecimal}` : int
}

/**
 * Format price for display - cuts decimals without rounding or truncation indicator
 * For prices < 1: 7 decimals
 * For prices >= 1: 2 decimals
 */
export function formatPriceForDisplay(price: number): string {
  if (price === 0) return '0'
  if (price < 0.000001) return price.toExponential(2)

  const str = price.toString()
  const [int, dec] = str.split('.')

  if (price < 1) {
    // For prices < 1: cut to 7 decimals (no rounding, no truncation indicator)
    if (!dec) return int
    const cutDecimals = dec.slice(0, 7)
    // Remove trailing zeros for cleaner display
    const trimmedDecimals = cutDecimals.replace(/0+$/, '')
    return trimmedDecimals ? `${int}.${trimmedDecimals}` : int
  } else {
    // For prices >= 1: cut to 2 decimals (no rounding, no truncation indicator)
    if (!dec) return int
    const cutDecimals = dec.slice(0, 2)
    // Remove trailing zeros for cleaner display
    const trimmedDecimals = cutDecimals.replace(/0+$/, '')
    return trimmedDecimals ? `${int}.${trimmedDecimals}` : int
  }
}

/**
 * Format amount for tooltip (full precision)
 */
export function formatAmountForTooltip(amount: number): string {
  if (amount === 0) return '0'
  if (amount < 0.000001) return amount.toExponential(8)
  // Show full precision up to 18 decimal places (typical for blockchain amounts)
  const amountStr = amount.toString()
  const [integerPart, decimalPart] = amountStr.split('.')

  if (!decimalPart) {
    return integerPart
  }

  // Remove trailing zeros but keep significant digits
  const trimmedDecimal = decimalPart.replace(/0+$/, '')
  return trimmedDecimal ? `${integerPart}.${trimmedDecimal}` : integerPart
}
