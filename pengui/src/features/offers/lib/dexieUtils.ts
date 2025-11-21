import type { OfferState } from '@/entities/offer'

/**
 * Dexie Offer types
 */
export interface DexieAsset {
  id: string
  code: string
  name: string
  amount: number
}

export interface DexieOffer {
  id: string
  status: number // Legacy field - we'll calculate state from dates instead
  offer?: string // Original offer string (available in POST responses)
  date_found: string
  date_completed?: string | null
  date_pending?: string | null
  date_expiry?: string | null
  block_expiry?: number | null
  spent_block_index?: number | null
  price: number
  offered: DexieAsset[]
  requested: DexieAsset[]
  fees: number
  known_taker?: unknown | null // null = cancelled, not null = completed
}

/**
 * Calculate offer state based on date fields and known_taker according to the specified logic:
 * Priority order (checked in sequence):
 * 1. CANCELLED: if spent_block_index exists (coin was spent = cancelled, highest priority)
 * 2. COMPLETED: if date_completed exists AND known_taker is not null
 * 3. PENDING: if date_pending exists (but not if already cancelled or completed)
 * 4. EXPIRED: if date_expiry is before date_found OR block_expiry exists
 * 5. OPEN: if date_found exists but no completion, no spending, within expiry
 * 6. UNKNOWN: if every date is null
 */
export function calculateOfferState(offer: DexieOffer): OfferState {
  // Extract and normalize data
  const dateFound = offer.date_found ? new Date(offer.date_found) : null
  const dateCompleted = offer.date_completed ? new Date(offer.date_completed) : null
  const datePending = offer.date_pending ? new Date(offer.date_pending) : null
  const dateExpiry = offer.date_expiry ? new Date(offer.date_expiry) : null
  const blockExpiry = offer.block_expiry
  const spentBlockIndex = offer.spent_block_index
  const knownTaker = offer.known_taker

  const hasValidKnownTaker = knownTaker !== null && knownTaker !== undefined
  const hasValidSpentBlockIndex = spentBlockIndex !== null && spentBlockIndex !== undefined
  const hasValidBlockExpiry = blockExpiry !== null && blockExpiry !== undefined

  // 1. CANCELLED: spent_block_index exists (coin was spent, offer cancelled) - highest priority
  // This takes precedence because if the coin was spent, the offer is definitely cancelled
  if (hasValidSpentBlockIndex) return 'Cancelled'

  // 2. COMPLETED: date_completed exists AND known_taker is not null
  // If completed and has a known taker, it's completed
  if (dateCompleted && hasValidKnownTaker) return 'Completed'

  // 3. PENDING: date_pending exists (but only if not cancelled or completed)
  // If date_pending exists, the offer is in pending state
  if (datePending) return 'Pending'

  // 4. EXPIRED: date_expiry is before date_found OR block_expiry exists
  // Check if offer has expired
  if (dateExpiry && dateFound && dateExpiry < dateFound) return 'Expired'
  if (hasValidBlockExpiry) return 'Expired'

  // 5. OPEN: date_found exists, no completion, no spending, within expiry (if any)
  // If found but not completed, cancelled, or expired, it's open
  if (dateFound && !dateCompleted) {
    const isWithinExpiry = !dateExpiry || dateFound < dateExpiry
    if (isWithinExpiry) return 'Open'
  }

  // 6. UNKNOWN: if every date is null
  return 'Unknown'
}

/**
 * Helper function to check if an offer state indicates completion
 */
export function isOfferCompleted(state: OfferState): boolean {
  return state === 'Completed'
}

/**
 * Helper function to check if an offer state indicates cancellation
 */
export function isOfferCancelled(state: OfferState): boolean {
  return state === 'Cancelled'
}

/**
 * Helper function to check if an offer state indicates it's still active
 */
export function isOfferActive(state: OfferState): boolean {
  return state === 'Open' || state === 'Pending'
}

/**
 * Helper function to check if an offer state indicates it's finalized
 */
export function isOfferFinalized(state: OfferState): boolean {
  return state === 'Completed' || state === 'Cancelled' || state === 'Expired'
}
