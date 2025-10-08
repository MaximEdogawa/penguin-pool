import { Button, HStack, Text } from 'tamagui'
import { useThemeStore } from '../../features/theme/model/themeStore'
import { createLogger } from '../../shared/lib/logger'

const logger = createLogger('ThemeToggle')

export function ThemeToggle() {
  const { mode, toggleMode } = useThemeStore()

  const handleToggle = () => {
    logger.warn('Theme toggle button pressed')
    toggleMode()
  }

  return (
    <Button onPress={handleToggle} variant="outlined">
      <HStack space="$2" alignItems="center">
        <Text>{mode === 'light' ? '🌙' : '☀️'}</Text>
        <Text>{mode === 'light' ? 'Dark' : 'Light'}</Text>
      </HStack>
    </Button>
  )
}
