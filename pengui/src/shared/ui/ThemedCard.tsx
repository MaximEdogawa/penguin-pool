import React from 'react'
import { Card, YStack } from 'tamagui'
import { createLogger } from '../lib/logger'

const logger = createLogger('ThemedCard')

interface ThemedCardProps {
  children: React.ReactNode
}

export function ThemedCard({ children }: ThemedCardProps) {
  logger.warn('ThemedCard rendered')

  return (
    <Card
      backgroundColor="$background"
      borderColor="$borderColor"
      padding="$4"
      borderRadius="$4"
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={4}
      elevation={3}
    >
      <YStack space="$3">{children}</YStack>
    </Card>
  )
}
