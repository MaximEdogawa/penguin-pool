import { Button, HStack, Text } from '@tamagui/core'
import React from 'react'
import { useThemeStore } from '../../../stores/themeStore'

export function ThemeToggle(): React.ReactElement {
  const { mode, toggleMode } = useThemeStore()

  return (
    <Button onPress={toggleMode} variant="outlined">
      <HStack space="$2" alignItems="center">
        <Text>{mode === 'light' ? '🌙' : '☀️'}</Text>
        <Text>{mode === 'light' ? 'Dark' : 'Light'}</Text>
      </HStack>
    </Button>
  )
}
