import { environment } from '@/shared/config/environment'
import type { OfferDetails } from '@/types/offer.types'
import Dexie from 'dexie'

// Extended offer interface for database storage
export interface StoredOffer extends OfferDetails {
  // Additional fields for database management
  syncedAt?: Date
  lastModified: Date
  isLocal: boolean
  walletAddress?: string
}

// Database class
export class PenguinPoolDB extends Dexie {
  // Define tables
  offers!: Dexie.Table<StoredOffer>

  constructor() {
    super(environment.database.indexedDB.name)

    this.version(environment.database.indexedDB.version).stores({
      offers: '++id, tradeId, status, createdAt, lastModified, walletAddress, syncedAt',
    })
  }
}

// Create database instance
export const db = new PenguinPoolDB()

// Database initialization
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open()
    console.log('✅ IndexedDB initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize IndexedDB:', error)
    throw error
  }
}

// Database cleanup
export async function clearDatabase(): Promise<void> {
  try {
    await db.delete()
    console.log('✅ IndexedDB cleared successfully')
  } catch (error) {
    console.error('❌ Failed to clear IndexedDB:', error)
    throw error
  }
}

// Check if database is supported
export function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window
}
