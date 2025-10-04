// Offer string parser for Chia offers
import type { OfferAsset } from '@/types/offer.types'
import { logger } from '../services/logger'

export interface ParsedOffer {
  assetsOffered: OfferAsset[]
  assetsRequested: OfferAsset[]
  creatorAddress?: string
  fee?: number
  valid: boolean
  error?: string
}

/**
 * Parse a Chia offer string to extract asset details
 * Note: Real Chia offer strings are complex binary-encoded structures
 * This parser provides basic validation and fallback extraction methods
 */
export function parseOfferString(offerString: string): ParsedOffer {
  const result: ParsedOffer = {
    assetsOffered: [],
    assetsRequested: [],
    valid: false,
  }

  try {
    // Basic validation
    if (!offerString || offerString.trim().length === 0) {
      result.error = 'Empty offer string'
      return result
    }

    const cleanOffer = offerString.trim()

    // Check if it looks like a base64 string (basic validation)
    if (!isValidBase64(cleanOffer)) {
      result.error = 'Invalid offer string format'
      return result
    }

    // Try to extract creator address using regex (fallback method)
    const creatorAddress = extractCreatorAddress(cleanOffer)
    if (creatorAddress) {
      result.creatorAddress = creatorAddress
    }

    // For now, we'll mark as valid if it passes basic validation
    // The wallet will handle the actual parsing and validation
    result.valid = true
    result.error = 'Offer parsing requires wallet integration - preview limited'

    logger.info('Offer string passed basic validation but requires wallet for full parsing')
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown parsing error'
  }

  return result
}

/**
 * Basic base64 validation
 */
function isValidBase64(str: string): boolean {
  try {
    // Check if string contains only valid base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    return base64Regex.test(str) && str.length > 0
  } catch {
    return false
  }
}

/**
 * Extract creator address from offer string using regex patterns
 * This is a fallback method when JSON parsing fails
 */
export function extractCreatorAddress(offerString: string): string | undefined {
  try {
    // Try to decode and look for address patterns
    const decoded = atob(offerString.trim())

    // Look for Chia address patterns (xch1...)
    const addressRegex = /xch1[a-z0-9]{58,62}/gi
    const matches = decoded.match(addressRegex)

    if (matches && matches.length > 0) {
      return matches[0]
    }
  } catch {
    // If decoding fails, try regex on raw string
    const addressRegex = /xch1[a-z0-9]{58,62}/gi
    const matches = offerString.match(addressRegex)

    if (matches && matches.length > 0) {
      return matches[0]
    }
  }

  return undefined
}

/**
 * Validate offer string format
 */
export function isValidOfferString(offerString: string): boolean {
  if (!offerString || offerString.trim().length === 0) {
    return false
  }

  const cleanOffer = offerString.trim()

  // Check basic format requirements - must be long enough to be a complete offer
  if (cleanOffer.length < 50) {
    return false
  }

  // Check if it looks like base64
  if (!isValidBase64(cleanOffer)) {
    return false
  }

  // Additional validation for complete offer strings
  // Chia offers are typically much longer than 50 characters
  if (cleanOffer.length < 100) {
    return false
  }

  return true
}
