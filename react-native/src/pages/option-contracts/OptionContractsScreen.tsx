import { Card, Text, VStack } from '@tamagui/core'
import React from 'react'

export function OptionContractsScreen(): React.ReactElement {
  return (
    <VStack space="$4" padding="$4" flex={1}>
      <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
        <VStack space="$4" alignItems="center" padding="$6">
          <Text fontSize="$8">📄</Text>
          <Text fontSize="$5" fontWeight="bold" color="$color">
            Option Contracts
          </Text>
          <Text fontSize="$3" color="$colorHover" textAlign="center">
            Option contracts functionality coming soon...
          </Text>
        </VStack>
      </Card>
    </VStack>
  )
}
