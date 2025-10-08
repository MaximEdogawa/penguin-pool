import { ToastProvider, ToastViewport } from '@tamagui/toast'
import React from 'react'
import { TamaguiProvider } from 'tamagui'
import { CurrentToast } from '../../components/CurrentToast'
import { config } from '../../tamagui.config'

interface AppProviderProps {
  children: React.ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <TamaguiProvider config={config}>
      <ToastProvider swipeDirection="horizontal" duration={6000}>
        {children}
        <CurrentToast />
        <ToastViewport top="$8" left={0} right={0} />
      </ToastProvider>
    </TamaguiProvider>
  )
}
