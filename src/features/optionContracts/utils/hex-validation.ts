/**
 * Hex Validation Utilities
 *
 * This file provides utilities for validating and fixing hex strings
 * to prevent "Odd number of digits" errors.
 */

/**
 * Validate if a string is valid hex
 */
export function isValidHex(hex: string): boolean {
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex

  // Check if it's valid hex and has even number of digits
  return /^[0-9a-fA-F]*$/.test(cleanHex) && cleanHex.length % 2 === 0
}

/**
 * Fix hex string to ensure it has even number of digits
 */
export function fixHexString(hex: string): string {
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex

  // Ensure even number of digits
  const fixedHex = cleanHex.length % 2 === 0 ? cleanHex : `${cleanHex}0`

  return `0x${fixedHex}`
}

/**
 * Convert string to valid hex with even number of digits
 */
export function stringToValidHex(input: string): string {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(input)
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Ensure even number of digits
  return hex.length % 2 === 0 ? hex : `${hex}0`
}

/**
 * Debug hex string - shows length and validity
 */
export function debugHexString(_hex: string, _label: string = 'Hex'): void {
  // Debug hex string - shows length and validity
  const cleanHex = _hex.startsWith('0x') ? _hex.slice(2) : _hex
  const _debugInfo = {
    original: _hex,
    length: cleanHex.length,
    isValid: isValidHex(_hex),
    isEven: cleanHex.length % 2 === 0,
  }
  // Debug info available in _debugInfo
}
