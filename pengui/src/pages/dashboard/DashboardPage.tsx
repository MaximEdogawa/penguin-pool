import { Button, H2, Paragraph, Text, YStack } from 'tamagui'
import { createLogger } from '../../shared/lib/logger'

const logger = createLogger('DashboardPage')

export function DashboardPage() {
  logger.describeFunction({
    name: 'DashboardPage',
    purpose: 'Renders the main dashboard interface for the Penguin Pool DeFi platform',
    returns: 'React component displaying dashboard content',
    sideEffects: ['Logs dashboard page render event'],
  })

  logger.warn('Dashboard page rendered')
  logger.warn('Dashboard page loaded successfully - logging system working!')

  const handleButtonPress = () => {
    logger.warn('Dashboard button pressed - user interaction logged!')
  }

  return (
    <YStack flex={1} alignItems="center" gap="$8" padding="$10" backgroundColor="$background">
      <H2>Penguin Pool Dashboard</H2>
      <Paragraph>Welcome to the DeFi lending platform</Paragraph>

      <Button
        size="$4"
        backgroundColor="$blue9"
        color="$blue1"
        onPress={handleButtonPress}
        borderRadius="$4"
        padding="$4"
      >
        <Text color="$white" fontSize="$4" fontWeight="bold">
          Test Logging System
        </Text>
      </Button>

      <Paragraph fontSize="$3" color="$colorHover" textAlign="center">
        Click the button above to test the logging system. Check the browser console for log
        messages.
      </Paragraph>
    </YStack>
  )
}
