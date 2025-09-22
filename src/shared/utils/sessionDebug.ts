/**
 * Session Debug Utilities
 * Helper functions for debugging session data and storage
 */

import { sessionManager } from '@/shared/services/sessionManager'

/**
 * Log current session data summary to console
 */
export function logSessionData(): void {
  if (typeof window === 'undefined') {
    console.log('Session debug: Running on server side')
    return
  }

  const summary = sessionManager.getSessionDataSummary()

  console.group('🔍 Session Data Summary')
  console.log('📦 localStorage keys:', summary.localStorage)
  console.log('🗂️ sessionStorage keys:', summary.sessionStorage)
  console.log('💾 IndexedDB databases:', summary.indexedDB)
  console.log('🗄️ Cache names:', summary.caches)
  console.groupEnd()
}

/**
 * Check if session data exists
 */
export function hasSessionData(): boolean {
  if (typeof window === 'undefined') return false

  const summary = sessionManager.getSessionDataSummary()
  return summary.localStorage.length > 0 || summary.sessionStorage.length > 0
}

/**
 * Get detailed storage information
 */
export async function getDetailedStorageInfo(): Promise<{
  localStorage: Record<string, string>
  sessionStorage: Record<string, string>
  indexedDB: string[]
  caches: string[]
}> {
  if (typeof window === 'undefined') {
    return {
      localStorage: {},
      sessionStorage: {},
      indexedDB: [],
      caches: [],
    }
  }

  // Get localStorage data
  const localStorageData: Record<string, string> = {}
  if (window.localStorage) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key) {
        localStorageData[key] = window.localStorage.getItem(key) || ''
      }
    }
  }

  // Get sessionStorage data
  const sessionStorageData: Record<string, string> = {}
  if (window.sessionStorage) {
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i)
      if (key) {
        sessionStorageData[key] = window.sessionStorage.getItem(key) || ''
      }
    }
  }

  // Get IndexedDB databases
  let indexedDBDatabases: string[] = []
  if ('indexedDB' in window) {
    try {
      const databases = await indexedDB.databases()
      indexedDBDatabases = databases.map(db => db.name || '').filter(Boolean)
    } catch (error) {
      console.warn('Failed to get IndexedDB databases:', error)
    }
  }

  // Get cache names
  let cacheNames: string[] = []
  if ('caches' in window) {
    try {
      cacheNames = await caches.keys()
    } catch (error) {
      console.warn('Failed to get cache names:', error)
    }
  }

  return {
    localStorage: localStorageData,
    sessionStorage: sessionStorageData,
    indexedDB: indexedDBDatabases,
    caches: cacheNames,
  }
}

/**
 * Clear session data with detailed logging
 */
export async function clearSessionWithLogging(options?: {
  clearWalletConnect?: boolean
  clearUserData?: boolean
  clearThemeData?: boolean
  clearPWAStorage?: boolean
  clearServiceWorker?: boolean
  clearAllCaches?: boolean
}): Promise<void> {
  console.group('🧹 Clearing Session Data')

  // Log before clearing
  console.log('Before clearing:')
  logSessionData()

  // Clear session data
  await sessionManager.clearAllSessionData(options)

  // Log after clearing
  console.log('After clearing:')
  logSessionData()

  console.groupEnd()
}

/**
 * Export session data for debugging (be careful with sensitive data)
 */
export function exportSessionData(): string {
  if (typeof window === 'undefined') return '{}'

  const summary = sessionManager.getSessionDataSummary()

  return JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      localStorage: summary.localStorage,
      sessionStorage: summary.sessionStorage,
      userAgent: navigator.userAgent,
      url: window.location.href,
    },
    null,
    2
  )
}

// Make functions available globally in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).sessionDebug = {
    logSessionData,
    hasSessionData,
    getDetailedStorageInfo,
    clearSessionWithLogging,
    exportSessionData,
  }
}
