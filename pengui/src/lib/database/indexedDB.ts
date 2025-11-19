import { environment } from '@/lib/config/environment'
import type { OfferDetails } from '@/types/offer.types'
import Dexie, { type Table } from 'dexie'

// Extended offer interface for database storage
export interface StoredOffer extends OfferDetails {
  // Additional fields for database management
  syncedAt?: Date
  lastModified: Date
  isLocal: boolean
  walletAddress?: string
}

// Database class
export class PenguiDB extends Dexie {
  // Define tables
  offers!: Table<StoredOffer>

  constructor() {
    super(environment.database.indexedDB.name)

    this.version(environment.database.indexedDB.version).stores({
      offers: '++id, id, tradeId, status, createdAt, lastModified, walletAddress, syncedAt',
    })
  }
}

// Create database instance
export const db = new PenguiDB()

// Database initialization
export async function initializeDatabase(): Promise<void> {
  await db.open()
}

// Database cleanup
export async function clearDatabase(): Promise<void> {
  await db.delete()
}

// Check if database is supported
export function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window
}
