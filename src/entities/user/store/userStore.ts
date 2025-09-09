import type { UserPreferences } from '@/app/types/common'
import { sessionManager } from '@/shared/services/sessionManager'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

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
  // State
  const currentUser = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasWallet = computed(() => currentUser.value?.walletAddress !== undefined)

  const userBalance = computed(() => currentUser.value?.balance || 0)

  const userPreferences = computed(() => currentUser.value?.preferences)

  // Initialize store from localStorage
  const initializeStore = () => {
    try {
      const storedUser = localStorage.getItem('penguin-pool-user')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        currentUser.value = user
        isAuthenticated.value = true
      }
    } catch (err) {
      console.error('Failed to restore user session:', err)
      localStorage.removeItem('penguin-pool-user')
    }
  }

  // Initialize store on creation
  initializeStore()

  // Actions
  const login = async (walletIdentifier: string | number, username?: string) => {
    isLoading.value = true
    error.value = null

    try {
      // In a real implementation, this would verify the wallet signature
      // and potentially call an API to get user data

      // Convert fingerprint to string for display, or use address if provided
      const walletAddress =
        typeof walletIdentifier === 'number' ? `fingerprint_${walletIdentifier}` : walletIdentifier

      // For now, create a mock user
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

      // Save to localStorage
      localStorage.setItem('penguin-pool-user', JSON.stringify(user))

      return user
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      // Clear user state
      currentUser.value = null
      isAuthenticated.value = false
      error.value = null

      // Use centralized session manager for comprehensive clearing
      await sessionManager.clearAllSessionData({
        clearUserData: true,
        clearThemeData: true,
        clearWalletConnect: false, // Let wallet store handle this
        clearPWAStorage: true,
        clearServiceWorker: true,
        clearAllCaches: false, // Don't clear all caches, just session-related ones
      })

      console.log('User logout completed successfully')
    } catch (err) {
      console.error('Error during user logout:', err)
      // Still clear local state even if session clearing fails
      currentUser.value = null
      isAuthenticated.value = false
      error.value = err instanceof Error ? err.message : 'Logout failed'
    }
  }

  const updateProfile = (updates: Partial<User>) => {
    if (currentUser.value) {
      currentUser.value = {
        ...currentUser.value,
        ...updates,
        updatedAt: new Date(),
      }

      // Update localStorage
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

      // Update localStorage
      localStorage.setItem('penguin-pool-user', JSON.stringify(currentUser.value))
    }
  }

  const updateBalance = (balance: number) => {
    if (currentUser.value) {
      currentUser.value.balance = balance
      currentUser.value.updatedAt = new Date()

      // Update localStorage
      localStorage.setItem('penguin-pool-user', JSON.stringify(currentUser.value))
    }
  }

  const checkSession = async () => {
    const savedUser = localStorage.getItem('penguin-pool-user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        // Convert date strings back to Date objects
        user.createdAt = new Date(user.createdAt)
        user.updatedAt = new Date(user.updatedAt)

        currentUser.value = user
        isAuthenticated.value = true
      } catch (err) {
        console.error('Failed to restore user session:', err)
        localStorage.removeItem('penguin-pool-user')
      }
    }
  }

  // Helper functions
  const generateId = () => {
    return Math.random().toString(36).substr(2, 9)
  }

  return {
    // State
    currentUser,
    isAuthenticated,
    isLoading,
    error,

    // Getters
    hasWallet,
    userBalance,
    userPreferences,

    // Actions
    login,
    logout,
    updateProfile,
    updatePreferences,
    updateBalance,
    checkSession,
  }
})
