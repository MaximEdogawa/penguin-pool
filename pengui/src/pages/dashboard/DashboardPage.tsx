import { Button, H2, Paragraph, Text, YStack } from 'tamagui'

export function DashboardPage() {
  const handleButtonPress = () => {
    // Button press handler
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
        <Text color="$color" fontSize="$4" fontWeight="bold">
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
