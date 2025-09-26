import { Query, QueryClient } from '@tanstack/vue-query'

// Check if debugging is enabled via environment variable
const isDebugEnabled =
  import.meta.env.VITE_ENABLE_DEBUG === 'true' ||
  import.meta.env.VITE_TANSTACK_DEBUG === 'true' ||
  import.meta.env.DEV

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

  const handleOffline = () => {
    console.log('📡 Network offline - queries paused')
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  if (!navigator.onLine) {
    handleOffline()
  }

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// Enhanced debugging setup for Vue DevTools
export function setupDebugging() {
  if (!isDebugEnabled) return

  // Expose queryClient to window for debugging
  if (typeof window !== 'undefined') {
    ;(window as unknown as Record<string, unknown>).__QUERY_CLIENT__ = queryClient

    // Enable TanStack Query DevTools
    if (import.meta.env.DEV) {
      // Enable query client devtools
      queryClient.setDefaultOptions({
        queries: {
          ...queryClient.getDefaultOptions().queries,
          // Enable more detailed logging in development
          refetchOnWindowFocus: false,
        },
      })

      console.log(
        '🔍 TanStack Query debugging enabled - queryClient available at window.__QUERY_CLIENT__'
      )
      console.log('🔍 Vue DevTools should show TanStack Query data in the Timeline tab')
    }
  }
}
