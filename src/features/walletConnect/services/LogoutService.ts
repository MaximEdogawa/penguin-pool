import { useMutation, useQueryClient } from '@tanstack/vue-query'

export function useLogoutService() {
  const queryClient = useQueryClient()
  const logoutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      try {
        await clearIndexedDB()
        // Logout completed successfully
      } catch (error) {
        // Logout failed
        throw error
      }
    },
    onSuccess: () => {
      queryClient.clear()
      // All queries cleared
    },
    onError: _error => {
      // Logout failed
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
        } catch {
          // Failed to clear database
        }
      }
    } catch {
      // Failed to clear IndexedDB
    }
  }

  return {
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    error: logoutMutation.error,
  }
}
