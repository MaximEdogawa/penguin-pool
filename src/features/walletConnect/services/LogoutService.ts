import { useMutation, useQueryClient } from '@tanstack/vue-query'

export function useLogoutService() {
  const queryClient = useQueryClient()
  const logoutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      try {
        await clearIndexedDB()
        console.log('✅ Logout completed successfully')
      } catch (error) {
        console.error('❌ Logout failed:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.clear()
      console.log('✅ All queries cleared')
    },
    onError: error => {
      console.error('❌ Logout failed:', error)
    },
  })

  async function clearIndexedDB(): Promise<void> {
    try {
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
