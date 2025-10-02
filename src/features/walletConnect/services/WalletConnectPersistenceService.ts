import { logger } from '@/shared/services/logger'
import type { SessionTypes } from '@walletconnect/types'
import { ref } from 'vue'

export interface PersistedWalletConnectData {
  session: SessionTypes.Struct | null
  lastConnectedAt: number
  projectId: string
}

class WalletConnectPersistenceService {
  private readonly STORAGE_KEY = 'penguin-pool-walletconnect-session'
  private readonly currentSession = ref<SessionTypes.Struct | null>(null)
  private readonly lastConnectedAt = ref<number | null>(null)

  saveSession(session: SessionTypes.Struct): void {
    try {
      const data: PersistedWalletConnectData = {
        session,
        lastConnectedAt: Date.now(),
        projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'unknown',
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
      this.currentSession.value = session
      this.lastConnectedAt.value = data.lastConnectedAt
    } catch (error) {
      logger.error('Failed to save WalletConnect session', error as Error)
    }
  }

  loadSession(): PersistedWalletConnectData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return null

      const data: PersistedWalletConnectData = JSON.parse(stored)

      if (!data.session || !this.isSessionValid(data.session)) {
        this.clearSession()
        return null
      }

      this.currentSession.value = data.session
      this.lastConnectedAt.value = data.lastConnectedAt
      return data
    } catch {
      this.clearSession()
      return null
    }
  }

  clearSession(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      this.currentSession.value = null
      this.lastConnectedAt.value = null
    } catch (error) {
      logger.error('Failed to save WalletConnect session', error as Error)
    }
  }

  isSessionValid(session: SessionTypes.Struct): boolean {
    if (!session.expiry) return false

    const now = Math.floor(Date.now() / 1000)
    return session.expiry > now
  }

  get hasValidSession(): boolean {
    return this.currentSession.value !== null && this.isSessionValid(this.currentSession.value)
  }

  get currentSessionData(): SessionTypes.Struct | null {
    return this.currentSession.value
  }

  get lastConnectedTimestamp(): number | null {
    return this.lastConnectedAt.value
  }

  get sessionExpiry(): Date | null {
    if (!this.currentSession.value?.expiry) return null
    return new Date(this.currentSession.value.expiry * 1000)
  }

  get timeUntilExpiry(): { seconds: number; minutes: number; hours: number } | null {
    if (!this.currentSession.value?.expiry) return null

    const now = Math.floor(Date.now() / 1000)
    const remaining = this.currentSession.value.expiry - now

    if (remaining <= 0) return null

    return {
      seconds: remaining,
      minutes: Math.floor(remaining / 60),
      hours: Math.floor(remaining / 3600),
    }
  }

  initialize(): void {
    const persistedData = this.loadSession()
    if (persistedData) {
      logger.info('🔄 WalletConnect persistence initialized with existing session')
    } else {
      logger.info('🔄 WalletConnect persistence initialized - no existing session')
    }
  }

  get reactiveCurrentSession() {
    return this.currentSession
  }

  get reactiveLastConnectedAt() {
    return this.lastConnectedAt
  }
}

const walletConnectPersistenceService = new WalletConnectPersistenceService()

export function useWalletConnectPersistenceService() {
  return {
    currentSession: walletConnectPersistenceService.reactiveCurrentSession,
    lastConnectedAt: walletConnectPersistenceService.reactiveLastConnectedAt,
    hasValidSession: { value: walletConnectPersistenceService.hasValidSession },
    sessionExpiry: { value: walletConnectPersistenceService.sessionExpiry },
    timeUntilExpiry: { value: walletConnectPersistenceService.timeUntilExpiry },
    saveSession: (session: SessionTypes.Struct) =>
      walletConnectPersistenceService.saveSession(session),
    loadSession: () => walletConnectPersistenceService.loadSession(),
    clearSession: () => walletConnectPersistenceService.clearSession(),
    initialize: () => walletConnectPersistenceService.initialize(),
    isSessionValid: (session: SessionTypes.Struct) =>
      walletConnectPersistenceService.isSessionValid(session),
  }
}

export { walletConnectPersistenceService }
