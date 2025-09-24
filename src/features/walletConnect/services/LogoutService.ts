import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useConnectionDataService } from './ConnectionDataService'
import { useUserDataService } from './UserDataService'

export function useLogoutService() {
  const queryClient = useQueryClient()
  const connectionService = useConnectionDataService()
  const userService = useUserDataService()

  const logoutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      try {
        console.log('🚪 Starting logout process...')

        // Disconnect wallet if connected
        if (connectionService.state.value.isConnected) {
          console.log('🔌 Disconnecting wallet...')
          await connectionService.disconnect()
        }

        // Clear user data
        userService.clearUserData()

        // Clear IndexedDB instances
        await clearIndexedDB()

        console.log('✅ Logout completed successfully')
      } catch (error) {
        console.error('❌ Logout failed:', error)
        throw error
      }
    },
    onSuccess: () => {
      // Clear all TanStack Query cache
      queryClient.clear()
      console.log('✅ All queries cleared')
    },
    onError: error => {
      console.error('❌ Logout failed:', error)
    },
  })

  async function clearIndexedDB(): Promise<void> {
    try {
      // Clear WalletConnect IndexedDB
      const databases = ['walletconnect-v2', 'walletconnect']

      for (const dbName of databases) {
        try {
          const deleteRequest = indexedDB.deleteDatabase(dbName)
          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve(true)
            deleteRequest.onerror = () => reject(deleteRequest.error)
          })
        } catch (error) {
          console.warn(`Failed to clear ${dbName}:`, error)
        }
      }
    } catch (error) {
      console.warn('Failed to clear IndexedDB:', error)
    }
  }

  return {
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    error: logoutMutation.error,
  }
}
