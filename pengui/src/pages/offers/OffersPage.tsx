import { H2, Paragraph, YStack } from 'tamagui'

export function OffersPage() {
  return (
    <YStack flex={1} alignItems="center" gap="$8" padding="$10" backgroundColor="$background">
      <H2>Offers Management</H2>
      <Paragraph>Manage your DeFi offers and contracts</Paragraph>
    </YStack>
  )
}
