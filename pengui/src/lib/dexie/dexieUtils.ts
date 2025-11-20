import type { OfferState } from '@/types/offer.types'

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
 * - Completed: if date_completed exists AND known_taker is not null
 * - Cancelled: if known_taker is null OR spent_block_index exists
 * - Pending: if date_pending exists
 * - Expired: if date_expiry or block_expiry after date_found
 * - Open: if there is a date_found but no completed date or date_found is smaller than date_expiry
 * - Unknown: if every date is null
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

  // 1. COMPLETED: date_completed exists AND known_taker is not null
  if (dateCompleted && hasValidKnownTaker) return 'Completed'

  // 2. CANCELLED: spent_block_index exists (coin was spent, offer cancelled)
  if (hasValidSpentBlockIndex) return 'Cancelled'

  // 3. PENDING: date_pending exists but no date_found yet
  if (datePending && !dateFound) return 'Pending'

  // 4. EXPIRED: date_expiry is before date_found OR block_expiry exists
  if (dateExpiry && dateFound && dateExpiry < dateFound) return 'Expired'
  if (hasValidBlockExpiry) return 'Expired'

  // 5. OPEN: date_found exists, no completion, no spending, within expiry (if any)
  if (dateFound && !dateCompleted) {
    const isWithinExpiry = !dateExpiry || dateFound < dateExpiry
    if (isWithinExpiry) return 'Open'
  }

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
