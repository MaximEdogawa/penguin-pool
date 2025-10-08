import { H2, Paragraph, YStack } from 'tamagui'

export default function NotFoundScreen() {
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding="$4"
      backgroundColor="$background"
    >
      <H2>Page Not Found</H2>
      <Paragraph>The page you're looking for doesn't exist.</Paragraph>
    </YStack>
  )
}
