import { Button, Card, HStack, ScrollView, Text, VStack } from '@tamagui/core'
import React, { useCallback, useEffect, useState } from 'react'
import { RefreshControl } from 'react-native'
import { useAuthStore } from '../../entities/user/model/useAuthStore'
import { walletService } from '../../services/walletService'
import type { WalletBalance } from '../../shared/types'

export function WalletScreen(): React.ReactElement {
  const { walletAddress } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const [isAddressCopied, setIsAddressCopied] = useState(false)
  const [balance, setBalance] = useState<WalletBalance>({
    confirmed: '0',
    spendable: '0',
    unconfirmed: '0',
  })

  const formatBalance = useCallback((mojos: string): string => {
    if (!mojos || mojos === '0') {
      return '0.000000'
    }
    return (parseFloat(mojos) / 1000000000000).toFixed(6)
  }, [])

  const formatAddress = useCallback((address: string): string => {
    if (!address) {
      return ''
    }
    if (address.length <= 10) {
      return address
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [])

  const copyAddress = useCallback(async (): Promise<void> => {
    if (walletAddress) {
      try {
        // In React Native, use Clipboard API
        // Address copied
        setIsAddressCopied(true)
        setTimeout(() => setIsAddressCopied(false), 2000)
      } catch (_error) {
        // Handle copy error
      }
    }
  }, [walletAddress])

  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!walletAddress) {
      return
    }

    setRefreshing(true)
    try {
      const walletBalance = await walletService.getBalance(walletAddress)
      setBalance(walletBalance)
    } catch (_error) {
      // Handle refresh error
    } finally {
      setRefreshing(false)
    }
  }, [walletAddress])

  const sendTransaction = useCallback((): void => {
    // Send transaction
    // Navigate to send transaction screen
  }, [])

  // Load initial balance
  useEffect(() => {
    if (walletAddress) {
      refreshBalance()
    }
  }, [walletAddress, refreshBalance])

  return (
    <ScrollView
      flex={1}
      backgroundColor="$background"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshBalance} />}
    >
      <VStack space="$4" padding="$4">
        {/* Wallet Balance Card */}
        <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
          <VStack space="$4">
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="bold" color="$color">
                Wallet Balance
              </Text>
              <HStack space="$2" alignItems="center">
                <Text fontSize="$4">💰</Text>
                <Text fontSize="$3" color="$colorHover">
                  XCH
                </Text>
              </HStack>
            </HStack>

            <HStack justifyContent="space-between" alignItems="center">
              <VStack>
                <Text fontSize="$8" fontWeight="bold" color="$color">
                  {formatBalance(balance.confirmed)}
                </Text>
                <Text fontSize="$3" color="$colorHover">
                  Available Balance
                </Text>
              </VStack>
              <VStack alignItems="flex-end">
                <Text fontSize="$3" color="$colorHover" fontFamily="$mono">
                  {formatAddress(walletAddress || '')}
                </Text>
                <Button size="$2" variant="ghost" onPress={copyAddress}>
                  <Text fontSize="$2" color="$blue9">
                    {isAddressCopied ? 'Copied!' : 'Copy Address'}
                  </Text>
                </Button>
              </VStack>
            </HStack>

            {/* Balance Details */}
            <VStack space="$2" paddingTop="$3" borderTopWidth={1} borderTopColor="$borderColor">
              <HStack justifyContent="space-between">
                <Text fontSize="$2" color="$colorHover">
                  Spendable:
                </Text>
                <Text fontSize="$2" color="$colorHover">
                  {formatBalance(balance.spendable)} XCH
                </Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text fontSize="$2" color="$colorHover">
                  Unconfirmed:
                </Text>
                <Text fontSize="$2" color="$colorHover">
                  {formatBalance(balance.unconfirmed)} XCH
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </Card>

        {/* Send Transaction Section */}
        <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
          <VStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$color">
              Send Transaction
            </Text>

            <VStack space="$3">
              <Button size="$4" backgroundColor="$blue9" color="$blue1" onPress={sendTransaction}>
                <HStack space="$2" alignItems="center">
                  <Text fontSize="$4">📤</Text>
                  <Text>Send XCH</Text>
                </HStack>
              </Button>

              <Text fontSize="$3" color="$colorHover" textAlign="center">
                Send transactions will be implemented here
              </Text>
            </VStack>
          </VStack>
        </Card>

        {/* Recent Transactions */}
        <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
          <VStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$color">
              Recent Transactions
            </Text>

            <VStack space="$4" alignItems="center" padding="$6">
              <Text fontSize="$8">📜</Text>
              <Text fontSize="$4" fontWeight="bold" color="$color">
                No transactions yet
              </Text>
              <Text fontSize="$3" color="$colorHover" textAlign="center">
                Transaction history will be displayed here
              </Text>
            </VStack>
          </VStack>
        </Card>

        {/* Quick Actions */}
        <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
          <VStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$color">
              Quick Actions
            </Text>

            <HStack space="$3">
              <Button
                size="$4"
                backgroundColor="$green9"
                color="$green1"
                flex={1}
                onPress={() => {
                  /* Receive */
                }}
              >
                <HStack space="$2" alignItems="center">
                  <Text fontSize="$4">📥</Text>
                  <Text>Receive</Text>
                </HStack>
              </Button>

              <Button
                size="$4"
                backgroundColor="$orange9"
                color="$orange1"
                flex={1}
                onPress={() => {
                  /* Swap */
                }}
              >
                <HStack space="$2" alignItems="center">
                  <Text fontSize="$4">🔄</Text>
                  <Text>Swap</Text>
                </HStack>
              </Button>
            </HStack>
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  )
}
