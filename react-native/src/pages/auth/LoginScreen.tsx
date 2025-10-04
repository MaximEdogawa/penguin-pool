import { useNavigation } from '@react-navigation/native'
import { Button, Card, Text, VStack } from '@tamagui/core'
import React from 'react'
import { useAuthStore } from '../../entities/user/model/useAuthStore'
import { env } from '../../shared/config/env'

export function LoginScreen(): React.ReactElement {
  const { login } = useAuthStore()
  const navigation = useNavigation()

  const handleConnectWallet = (): void => {
    // Mock wallet connection for now
    const mockUser = {
      id: '1',
      name: 'Penguin User',
      email: 'user@penguinpool.com',
    }
    const mockAddress = '0x1234567890123456789012345678901234567890'

    login(mockUser, mockAddress, 'web3modal')

    // Navigate to authenticated tabs
    navigation.navigate('Authenticated' as never)
  }

  return (
    <VStack flex={1} justifyContent="center" alignItems="center" padding="$4">
      <Card padding="$6" backgroundColor="$background" borderRadius="$4">
        <VStack space="$4" alignItems="center">
          <Text fontSize="$8">🐧</Text>
          <Text fontSize="$6" fontWeight="bold" color="$color">
            {env.APP_NAME}
          </Text>
          <Text fontSize="$3" color="$colorHover" textAlign="center">
            Connect your wallet to access the DeFi platform
          </Text>

          <VStack space="$3" width="100%">
            <Button size="$4" backgroundColor="$blue9" color="$blue1" onPress={handleConnectWallet}>
              Connect Wallet
            </Button>

            <Text fontSize="$2" color="$colorHover" textAlign="center">
              Supported wallets: MetaMask, WalletConnect, Coinbase Wallet
            </Text>
          </VStack>
        </VStack>
      </Card>
    </VStack>
  )
}
