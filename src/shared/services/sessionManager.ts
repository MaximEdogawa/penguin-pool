import { logger } from './logger'

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

  async clearAllSessionData(options: SessionClearOptions = {}): Promise<void> {
    const {
      clearWalletConnect = true,
      clearUserData = true,
      clearThemeData = true,
      clearPWAStorage = true,
      clearServiceWorker = true,
      clearAllCaches = true,
    } = options

    try {
      if (clearUserData || clearThemeData || clearWalletConnect) {
        await this.clearLocalStorage(clearUserData, clearThemeData, clearWalletConnect)
      }

      if (clearWalletConnect) {
        await this.clearSessionStorage()
      }

      if (clearPWAStorage) {
        await this.clearPWAStorage()
      }

      if (clearServiceWorker) {
        await this.clearServiceWorker()
      }

      if (clearAllCaches) {
        await this.clearAllCaches()
      }
    } catch (error) {
      logger.error('Failed to clear session data', error as Error)
    }
  }

  private async clearLocalStorage(
    clearUserData: boolean,
    clearThemeData: boolean,
    clearWalletConnect: boolean
  ): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) return

    const allKeys = Object.keys(window.localStorage)

    const keysToRemove = allKeys.filter(key => {
      if (
        clearUserData &&
        (key.startsWith('penguin-pool-user') ||
          key.includes('user') ||
          key.includes('auth') ||
          key.includes('session'))
      ) {
        return true
      }

      if (
        clearThemeData &&
        (key.startsWith('penguin-pool-theme') ||
          key.includes('theme') ||
          key.includes('dark-mode') ||
          key.includes('light-mode'))
      ) {
        return true
      }

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
        return true
      }

      return false
    })

    keysToRemove.forEach(key => {
      try {
        window.localStorage.removeItem(key)
      } catch (error) {
        logger.error('Failed to clear session data', error as Error)
      }
    })
  }

  private async clearSessionStorage(): Promise<void> {
    if (typeof window === 'undefined' || !window.sessionStorage) return

    const allKeys = Object.keys(window.sessionStorage)

    const keysToRemove = allKeys.filter(
      key =>
        key.startsWith('walletconnect') ||
        key.startsWith('walletConnect') ||
        key.startsWith('wc@') ||
        key.includes('wallet') ||
        key.includes('session') ||
        key.includes('auth')
    )

    keysToRemove.forEach(key => {
      try {
        window.sessionStorage.removeItem(key)
      } catch (error) {
        logger.error('Failed to clear session data', error as Error)
      }
    })
  }

  private async clearPWAStorage(): Promise<void> {
    if (typeof window === 'undefined') return

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
      } catch (error) {
        logger.error('Failed to clear session data', error as Error)
      }
    }

    if ('navigator' in window && 'storage' in navigator) {
      try {
        if ('clear' in navigator.storage) {
          await (navigator.storage as { clear: () => Promise<void> }).clear()
        }
      } catch (error) {
        logger.error('Failed to clear session data', error as Error)
      }
    }
  }

  private async clearServiceWorker(): Promise<void> {
    if (typeof window === 'undefined') return

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
      } catch (error) {
        logger.error('Failed to clear session data', error as Error)
      }
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_SESSION_DATA',
          timestamp: Date.now(),
        })
      } catch (error) {
        logger.error('Failed to clear session data', error as Error)
      }
    }
  }

  private async clearAllCaches(): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) return

    try {
      const cacheNames = await caches.keys()
      const clearPromises = cacheNames.map(cacheName => caches.delete(cacheName))
      await Promise.allSettled(clearPromises)
    } catch (error) {
      logger.error('Failed to clear session data', error as Error)
    }
  }

  private clearGlobalReferences(): void {
    if (typeof window === 'undefined') return

    delete (window as unknown as Record<string, unknown>).__WALLETCONNECT_SIGN_CLIENT__
    delete (window as unknown as Record<string, unknown>).__WALLETCONNECT_MODAL__
    delete (window as unknown as Record<string, unknown>).__WALLETCONNECT_UI__
    delete (window as unknown as Record<string, unknown>).__PENGUIN_POOL_USER__
    delete (window as unknown as Record<string, unknown>).__PENGUIN_POOL_SESSION__
  }

  async clearSessionByPattern(pattern: string | RegExp): Promise<void> {
    if (typeof window === 'undefined') return

    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    if (window.localStorage) {
      const localStorageKeys = Object.keys(window.localStorage)
      localStorageKeys
        .filter(key => regex.test(key))
        .forEach(key => window.localStorage.removeItem(key))
    }

    if (window.sessionStorage) {
      const sessionStorageKeys = Object.keys(window.sessionStorage)
      sessionStorageKeys
        .filter(key => regex.test(key))
        .forEach(key => window.sessionStorage.removeItem(key))
    }
  }

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
      indexedDB: [],
      caches: [],
    }
  }
}

export const sessionManager = SessionManager.getInstance()

export const clearAllSessionData = (options?: SessionClearOptions) =>
  sessionManager.clearAllSessionData(options)

export const clearSessionByPattern = (pattern: string | RegExp) =>
  sessionManager.clearSessionByPattern(pattern)

export const getSessionDataSummary = () => sessionManager.getSessionDataSummary()
