import React from 'react'
import { AppProvider } from './AppProvider'

interface AppProps {
  children: React.ReactNode
}

export function App({ children }: AppProps) {
  return <AppProvider>{children}</AppProvider>
}
