import { router } from 'expo-router'
import { Button, H2, Paragraph, YStack } from 'tamagui'

export default function ModalScreen() {
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding="$4"
      backgroundColor="$background"
    >
      <H2>Modal</H2>
      <Paragraph>This is a modal screen.</Paragraph>
      <Button onPress={() => router.back()} backgroundColor="$blue9" color="$blue1" marginTop="$4">
        Close Modal
      </Button>
    </YStack>
  )
}
