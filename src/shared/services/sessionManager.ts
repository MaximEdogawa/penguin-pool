/**
 * Centralized Session Management Service
 * Handles comprehensive session clearing for both local and PWA environments
 */

export interface SessionClearOptions {
  clearWalletConnect?: boolean
  clearUserData?: boolean
  clearThemeData?: boolean
  clearPWAStorage?: boolean
  clearServiceWorker?: boolean
  clearAllCaches?: boolean
}

export class SessionManager {
  private static instance: SessionManager

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  /**
   * Clear all session data comprehensively
   */
  async clearAllSessionData(options: SessionClearOptions = {}): Promise<void> {
    const {
      clearWalletConnect = true,
      clearUserData = true,
      clearThemeData = true,
      clearPWAStorage = true,
      clearServiceWorker = true,
      clearAllCaches = true,
    } = options

    console.log('Starting comprehensive session clearing...')

    try {
      // Clear localStorage data
      if (clearUserData || clearThemeData || clearWalletConnect) {
        await this.clearLocalStorage(clearUserData, clearThemeData, clearWalletConnect)
      }

      // Clear sessionStorage data
      if (clearWalletConnect) {
        await this.clearSessionStorage()
      }

      // Clear PWA storage mechanisms
      if (clearPWAStorage) {
        await this.clearPWAStorage()
      }

      // Clear service worker data
      if (clearServiceWorker) {
        await this.clearServiceWorkerData()
      }

      // Clear all caches
      if (clearAllCaches) {
        await this.clearAllCaches()
      }

      // Clear global window references
      this.clearGlobalReferences()

      console.log('Session clearing completed successfully')
    } catch (error) {
      console.error('Error during session clearing:', error)
      throw error
    }
  }

  /**
   * Clear localStorage data based on options
   */
  private async clearLocalStorage(
    clearUserData: boolean,
    clearThemeData: boolean,
    clearWalletConnect: boolean
  ): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) return

    const keysToRemove: string[] = []

    // Get all localStorage keys
    const allKeys = Object.keys(window.localStorage)

    for (const key of allKeys) {
      let shouldRemove = false

      // User data patterns
      if (
        clearUserData &&
        (key.startsWith('penguin-pool-user') ||
          key.includes('user') ||
          key.includes('auth') ||
          key.includes('session'))
      ) {
        shouldRemove = true
      }

      // Theme data patterns
      if (
        clearThemeData &&
        (key.startsWith('penguin-pool-theme') ||
          key.includes('theme') ||
          key.includes('dark-mode') ||
          key.includes('light-mode'))
      ) {
        shouldRemove = true
      }

      // WalletConnect data patterns
      if (
        clearWalletConnect &&
        (key.startsWith('walletconnect') ||
          key.startsWith('walletConnect') ||
          key.startsWith('wc@') ||
          key.includes('wallet') ||
          key.includes('fingerprint') ||
          key.includes('topic') ||
          key.includes('expiry') ||
          key.includes('accounts') ||
          key.includes('chainId'))
      ) {
        shouldRemove = true
      }

      if (shouldRemove) {
        keysToRemove.push(key)
      }
    }

    // Remove identified keys
    for (const key of keysToRemove) {
      try {
        window.localStorage.removeItem(key)
        console.log(`Cleared localStorage key: ${key}`)
      } catch (error) {
        console.warn(`Failed to clear localStorage key ${key}:`, error)
      }
    }
  }

  /**
   * Clear sessionStorage data
   */
  private async clearSessionStorage(): Promise<void> {
    if (typeof window === 'undefined' || !window.sessionStorage) return

    const keysToRemove: string[] = []
    const allKeys = Object.keys(window.sessionStorage)

    for (const key of allKeys) {
      if (
        key.startsWith('walletconnect') ||
        key.startsWith('walletConnect') ||
        key.startsWith('wc@') ||
        key.includes('wallet') ||
        key.includes('session') ||
        key.includes('auth')
      ) {
        keysToRemove.push(key)
      }
    }

    for (const key of keysToRemove) {
      try {
        window.sessionStorage.removeItem(key)
        console.log(`Cleared sessionStorage key: ${key}`)
      } catch (error) {
        console.warn(`Failed to clear sessionStorage key ${key}:`, error)
      }
    }
  }

  /**
   * Clear PWA storage mechanisms (IndexedDB, WebSQL, etc.)
   */
  private async clearPWAStorage(): Promise<void> {
    if (typeof window === 'undefined') return

    // Clear IndexedDB
    if ('indexedDB' in window) {
      try {
        const databases = await indexedDB.databases()
        const clearPromises = databases
          .filter(
            db =>
              db.name &&
              (db.name.includes('walletconnect') ||
                db.name.includes('wc@') ||
                db.name.includes('penguin-pool') ||
                db.name.includes('kurrentdb'))
          )
          .map(db => {
            if (db.name) {
              return indexedDB.deleteDatabase(db.name)
            }
            return Promise.resolve()
          })

        await Promise.allSettled(clearPromises)
        console.log('Cleared IndexedDB databases')
      } catch (error) {
        console.warn('Failed to clear IndexedDB:', error)
      }
    }

    // Clear WebSQL (legacy support)
    if ('openDatabase' in window) {
      try {
        const db = (
          window as unknown as {
            openDatabase: (
              name: string,
              version: string,
              displayName: string,
              size: number
            ) => unknown
          }
        ).openDatabase('penguin-pool', '1.0', 'Penguin Pool DB', 2 * 1024 * 1024)
        if (db) {
          await new Promise<void>((resolve, reject) => {
            ;(
              db as {
                transaction: (
                  callback: (tx: { executeSql: (sql: string) => void }) => void,
                  errorCallback: (error: unknown) => void,
                  successCallback: () => void
                ) => void
              }
            ).transaction(
              (tx: { executeSql: (sql: string) => void }) => {
                tx.executeSql('DROP TABLE IF EXISTS sessions')
                tx.executeSql('DROP TABLE IF EXISTS users')
                tx.executeSql('DROP TABLE IF EXISTS contracts')
                tx.executeSql('DROP TABLE IF EXISTS loans')
              },
              reject,
              resolve
            )
          })
          console.log('Cleared WebSQL database')
        }
      } catch (error) {
        console.warn('Failed to clear WebSQL:', error)
      }
    }

    // Clear navigator.storage
    if ('navigator' in window && 'storage' in navigator) {
      try {
        if ('clear' in navigator.storage) {
          await (navigator.storage as { clear: () => Promise<void> }).clear()
          console.log('Cleared navigator.storage')
        }
      } catch (error) {
        console.warn('Failed to clear navigator.storage:', error)
      }
    }
  }

  /**
   * Clear service worker data and caches
   */
  private async clearServiceWorkerData(): Promise<void> {
    if (typeof window === 'undefined') return

    // Clear service worker caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        const clearPromises = cacheNames
          .filter(
            cacheName =>
              cacheName.includes('walletconnect') ||
              cacheName.includes('wc@') ||
              cacheName.includes('penguin-pool') ||
              cacheName.includes('kurrentdb')
          )
          .map(cacheName => caches.delete(cacheName))

        await Promise.allSettled(clearPromises)
        console.log('Cleared service worker caches')
      } catch (error) {
        console.warn('Failed to clear service worker caches:', error)
      }
    }

    // Notify service worker to clear its data
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_SESSION_DATA',
          timestamp: Date.now(),
        })
        console.log('Notified service worker to clear session data')
      } catch (error) {
        console.warn('Failed to notify service worker:', error)
      }
    }
  }

  /**
   * Clear all browser caches
   */
  private async clearAllCaches(): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) return

    try {
      const cacheNames = await caches.keys()
      const clearPromises = cacheNames.map(cacheName => caches.delete(cacheName))
      await Promise.allSettled(clearPromises)
      console.log('Cleared all browser caches')
    } catch (error) {
      console.warn('Failed to clear all caches:', error)
    }
  }

  /**
   * Clear global window references
   */
  private clearGlobalReferences(): void {
    if (typeof window === 'undefined') return

    // Clear WalletConnect global references
    delete (window as unknown as Record<string, unknown>).__WALLETCONNECT_SIGN_CLIENT__
    delete (window as unknown as Record<string, unknown>).__WALLETCONNECT_MODAL__
    delete (window as unknown as Record<string, unknown>).__WALLETCONNECT_UI__

    // Clear any other global references
    delete (window as unknown as Record<string, unknown>).__PENGUIN_POOL_USER__
    delete (window as unknown as Record<string, unknown>).__PENGUIN_POOL_SESSION__

    console.log('Cleared global window references')
  }

  /**
   * Clear specific session data by pattern
   */
  async clearSessionByPattern(pattern: string | RegExp): Promise<void> {
    if (typeof window === 'undefined') return

    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    // Clear localStorage
    if (window.localStorage) {
      const localStorageKeys = Object.keys(window.localStorage)
      for (const key of localStorageKeys) {
        if (regex.test(key)) {
          window.localStorage.removeItem(key)
          console.log(`Cleared localStorage key by pattern: ${key}`)
        }
      }
    }

    // Clear sessionStorage
    if (window.sessionStorage) {
      const sessionStorageKeys = Object.keys(window.sessionStorage)
      for (const key of sessionStorageKeys) {
        if (regex.test(key)) {
          window.sessionStorage.removeItem(key)
          console.log(`Cleared sessionStorage key by pattern: ${key}`)
        }
      }
    }
  }

  /**
   * Get current session data summary (for debugging)
   */
  getSessionDataSummary(): {
    localStorage: string[]
    sessionStorage: string[]
    indexedDB: string[]
    caches: string[]
  } {
    if (typeof window === 'undefined') {
      return {
        localStorage: [],
        sessionStorage: [],
        indexedDB: [],
        caches: [],
      }
    }

    return {
      localStorage: Object.keys(window.localStorage || {}),
      sessionStorage: Object.keys(window.sessionStorage || {}),
      indexedDB: [], // Would need async call to get actual DB names
      caches: [], // Would need async call to get actual cache names
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance()

// Export convenience functions
export const clearAllSessionData = (options?: SessionClearOptions) =>
  sessionManager.clearAllSessionData(options)

export const clearSessionByPattern = (pattern: string | RegExp) =>
  sessionManager.clearSessionByPattern(pattern)

export const getSessionDataSummary = () => sessionManager.getSessionDataSummary()
