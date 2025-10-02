import type { UserPreferences } from '@/app/types/common'
import { useSessionDataService } from '@/features/walletConnect/services/SessionDataService'
import { logger } from '@/shared/services/logger'
import { sessionManager } from '@/shared/services/sessionManager'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export interface User {
  id: string
  username: string
  walletAddress: string
  balance: number
  createdAt: Date
  updatedAt: Date
  preferences: UserPreferences
}

export const useUserStore = defineStore('user', () => {
  const session = useSessionDataService()
  const currentUser = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9)
  }

  const login = async (walletIdentifier: string | number, username?: string) => {
    logger.info('🔐 Login function called with:', {
      walletIdentifier,
      username,
      isAuthenticated: isAuthenticated.value,
    })

    if (isAuthenticated.value && currentUser.value?.walletAddress === walletIdentifier.toString()) {
      logger.info('✅ User already authenticated with same wallet')
      return currentUser.value
    }

    isLoading.value = true
    error.value = null

    try {
      const walletAddress =
        typeof walletIdentifier === 'number' ? `fingerprint_${walletIdentifier}` : walletIdentifier

      const user: User = {
        id: generateId(),
        username: username || `User_${walletAddress.slice(-6)}`,
        walletAddress,
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          theme: 'auto',
          language: 'en',
          currency: 'XCH',
          notifications: {
            email: false,
            push: true,
            sms: false,
          },
          privacy: {
            shareAnalytics: false,
            shareUsageData: false,
          },
        },
      }

      currentUser.value = user
      isAuthenticated.value = true

      localStorage.setItem('penguin-pool-user', JSON.stringify(user))
      logger.info('✅ User login successful:', { user, isAuthenticated: isAuthenticated.value })
      return user
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      logger.error('❌ Login failed:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      currentUser.value = null
      isAuthenticated.value = false
      error.value = null

      await sessionManager.clearAllSessionData({
        clearUserData: true,
        clearThemeData: true,
        clearWalletConnect: true,
        clearPWAStorage: true,
        clearServiceWorker: true,
        clearAllCaches: false,
      })

      logger.info('User logout completed successfully')
    } catch (err) {
      logger.error('Error during user logout:', err)
      currentUser.value = null
      isAuthenticated.value = false
      error.value = err instanceof Error ? err.message : 'Logout failed'
    }
  }

  watch(
    session.isConnected,
    connected => {
      logger.info('🔄 User store watcher triggered:', {
        connected,
        isAuthenticated: isAuthenticated.value,
      })
      if (connected) {
        if (!isAuthenticated.value) {
          logger.info('🔐 Logging in user with fingerprint:', session.fingerprint.value)
          login(session.fingerprint.value)
        }
      } else {
        if (isAuthenticated.value) {
          logger.info('🚪 Logging out user')
          logout()
        }
      }
    },
    { immediate: true }
  )

  const hasWallet = computed(() => currentUser.value?.walletAddress !== undefined)
  const userBalance = computed(() => currentUser.value?.balance || 0)
  const userPreferences = computed(() => currentUser.value?.preferences)
  const isWalletConnected = computed(() => session.isConnected.value)
  const userWalletAddress = computed(() => session.fingerprint.value)

  const initializeStore = () => {
    try {
      const storedUser = localStorage.getItem('penguin-pool-user')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        currentUser.value = user
        isAuthenticated.value = true
      }
    } catch (err) {
      logger.error('Failed to restore user session:', err)
      localStorage.removeItem('penguin-pool-user')
    }
  }

  initializeStore()

  const updateProfile = (updates: Partial<User>) => {
    if (currentUser.value) {
      currentUser.value = {
        ...currentUser.value,
        ...updates,
        updatedAt: new Date(),
      }

      localStorage.setItem('penguin-pool-user', JSON.stringify(currentUser.value))
    }
  }

  const updatePreferences = (preferences: Partial<UserPreferences>) => {
    if (currentUser.value) {
      currentUser.value.preferences = {
        ...currentUser.value.preferences,
        ...preferences,
      }
      currentUser.value.updatedAt = new Date()
    }
  }

  const updateBalance = (balance: number) => {
    if (currentUser.value) {
      currentUser.value.balance = balance
      currentUser.value.updatedAt = new Date()
    }
  }

  const checkSession = async () => {
    const savedUser = localStorage.getItem('penguin-pool-user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        user.createdAt = new Date(user.createdAt)
        user.updatedAt = new Date(user.updatedAt)
        currentUser.value = user
        isAuthenticated.value = true
      } catch (err) {
        logger.error('Failed to restore user session:', err)
        localStorage.removeItem('penguin-pool-user')
      }
    }
  }

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    hasWallet,
    userBalance,
    userPreferences,
    isWalletConnected,
    walletAddress: userWalletAddress,
    login,
    logout,
    updateProfile,
    updatePreferences,
    updateBalance,
    checkSession,
  }
})
