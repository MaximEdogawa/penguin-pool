import { Query, QueryClient } from '@tanstack/vue-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error instanceof Error && 'status' in error) {
          const status = (error as { status: number }).status
          if (status >= 400 && status < 500) {
            return false
          }
        }
        return failureCount < 3
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: (query: Query) => {
        return navigator.onLine && query.state.status !== 'pending'
      },
      refetchOnReconnect: 'always',
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
})

export function setupOfflineHandling() {
  const handleOnline = () => {
    queryClient.invalidateQueries()
  }

  const handleOffline = () => {}

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  if (!navigator.onLine) {
    handleOffline()
  }
}
