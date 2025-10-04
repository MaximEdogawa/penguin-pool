import { QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppNavigator } from './src/app/navigation/AppNavigator'
import { ThemeProvider } from './src/app/providers/ThemeProvider'
import { QueryDevTools } from './src/shared/lib/devtools'
import { queryClient } from './src/shared/lib/queryClient'

export default function App(): React.ReactElement {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppNavigator />
          <QueryDevTools />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
