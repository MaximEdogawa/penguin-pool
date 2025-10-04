import { TamaguiProvider } from '@tamagui/core'
import React from 'react'
import tamaguiConfig from '../../../tamagui.config'
import { useThemeStore } from '../../stores/themeStore'

export function ThemeProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { mode } = useThemeStore()

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={mode}>
      {children}
    </TamaguiProvider>
  )
}
