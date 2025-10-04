import { Button, Card, HStack, Text, VStack } from '@tamagui/core'
import React, { useCallback, useEffect, useState } from 'react'
import { RefreshControl, ScrollView } from 'react-native'
import { useAuthStore } from '../../entities/user/model/useAuthStore'
import { logger } from '../../shared/services/logger'
import { walletService } from '../../services/walletService'
import type { WalletBalance } from '../../shared/types'

export function DashboardScreen(): React.ReactElement {
  const { walletAddress } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
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
      // In React Native, we would use Clipboard API
      // Address copied
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
      logger.error('Failed to refresh balance', _error as Error)
    } finally {
      setRefreshing(false)
    }
  }, [walletAddress])

  const toggleAutoRefresh = useCallback((): void => {
    setAutoRefreshEnabled(!autoRefreshEnabled)
  }, [autoRefreshEnabled])

  const navigateToWallet = useCallback((): void => {
    // Navigation will be handled by React Navigation
    // Navigate to wallet
  }, [])

  const makeOffer = useCallback((): void => {
    // Navigate to offers page
    // Make offer
  }, [])

  const browseOffers = useCallback((): void => {
    // Navigate to offers page
    // Browse offers
  }, [])

  // Load initial data
  useEffect((): void => {
    if (walletAddress) {
      refreshBalance()
    }
  }, [walletAddress, refreshBalance])

  // Auto-refresh functionality
  useEffect((): void => {
    if (autoRefreshEnabled && walletAddress) {
      const interval = setInterval(
        (): void => {
          refreshBalance()
        },
        5 * 60 * 1000
      ) // 5 minutes

      return (): void => clearInterval(interval)
    }
  }, [autoRefreshEnabled, walletAddress, refreshBalance])

  return (
    <ScrollView
      flex={1}
      backgroundColor="$background"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshBalance} />}
    >
      <VStack space="$4" padding="$4">
        {/* Quick Stats */}
        <VStack space="$3">
          {/* Wallet Balance Card */}
          <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
            <VStack space="$3">
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space="$2" alignItems="center">
                  <Text fontSize="$6">💰</Text>
                  <Text fontSize="$3" fontWeight="bold" color="$color">
                    Wallet Balance
                  </Text>
                </HStack>
                <HStack space="$2">
                  <Button size="$2" variant="ghost" onPress={refreshBalance} disabled={refreshing}>
                    <Text>{refreshing ? '⟳' : '↻'}</Text>
                  </Button>
                  <Button
                    size="$2"
                    variant="ghost"
                    onPress={toggleAutoRefresh}
                    backgroundColor={autoRefreshEnabled ? '$blue9' : '$gray9'}
                  >
                    <Text>⏰</Text>
                  </Button>
                </HStack>
              </HStack>

              <VStack space="$2">
                <HStack alignItems="center" space="$2">
                  <Text fontSize="$7" fontWeight="bold" color="$color">
                    {formatBalance(balance.confirmed)} XCH
                  </Text>
                  {refreshing && <Text fontSize="$2">⟳</Text>}
                </HStack>

                <VStack space="$1">
                  <HStack justifyContent="space-between">
                    <Text fontSize="$2" color="$colorHover">
                      Spendable:
                    </Text>
                    <Text fontSize="$2" color="$colorHover">
                      {formatBalance(balance.spendable)} XCH
                    </Text>
                  </HStack>
                </VStack>

                {walletAddress && (
                  <VStack
                    space="$2"
                    paddingTop="$2"
                    borderTopWidth={1}
                    borderTopColor="$borderColor"
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <HStack space="$2" alignItems="center" flex={1}>
                        <Text fontSize="$2">🆔</Text>
                        <Text
                          fontSize="$2"
                          color="$colorHover"
                          fontFamily="$mono"
                          numberOfLines={1}
                        >
                          {formatAddress(walletAddress)}
                        </Text>
                      </HStack>
                      <Button size="$2" variant="ghost" onPress={copyAddress}>
                        <Text fontSize="$2">📋</Text>
                      </Button>
                    </HStack>
                  </VStack>
                )}

                <Text fontSize="$2" color="$green9">
                  ✅ Wallet connected
                </Text>
              </VStack>
            </VStack>
          </Card>

          {/* Stats Cards */}
          <HStack space="$3">
            <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1}>
              <HStack space="$3" alignItems="center">
                <Text fontSize="$6">📈</Text>
                <VStack>
                  <Text fontSize="$2" color="$colorHover">
                    Active Loans
                  </Text>
                  <Text fontSize="$5" fontWeight="bold" color="$color">
                    0
                  </Text>
                </VStack>
              </HStack>
            </Card>

            <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4" flex={1}>
              <HStack space="$3" alignItems="center">
                <Text fontSize="$6">📄</Text>
                <VStack>
                  <Text fontSize="$2" color="$colorHover">
                    Contracts
                  </Text>
                  <Text fontSize="$5" fontWeight="bold" color="$color">
                    0
                  </Text>
                </VStack>
              </HStack>
            </Card>
          </HStack>

          <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
            <HStack space="$3" alignItems="center">
              <Text fontSize="$6">🐷</Text>
              <VStack>
                <Text fontSize="$2" color="$colorHover">
                  Piggy Bank
                </Text>
                <Text fontSize="$5" fontWeight="bold" color="$color">
                  0 coins
                </Text>
              </VStack>
            </HStack>
          </Card>
        </VStack>

        {/* Quick Actions */}
        <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
          <VStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$color">
              Quick Actions
            </Text>

            <VStack space="$3">
              <Button size="$4" backgroundColor="$blue9" color="$blue1" onPress={navigateToWallet}>
                <HStack space="$2" alignItems="center">
                  <Text fontSize="$4">📤</Text>
                  <Text>Send Transaction</Text>
                </HStack>
              </Button>

              <HStack space="$3">
                <Button
                  size="$4"
                  backgroundColor="$gray9"
                  color="$gray1"
                  onPress={makeOffer}
                  flex={1}
                >
                  <HStack space="$2" alignItems="center">
                    <Text fontSize="$4">🤝</Text>
                    <Text>Make Offer</Text>
                  </HStack>
                </Button>

                <Button
                  size="$4"
                  backgroundColor="$gray9"
                  color="$gray1"
                  onPress={browseOffers}
                  flex={1}
                >
                  <HStack space="$2" alignItems="center">
                    <Text fontSize="$4">🔍</Text>
                    <Text>Browse Offers</Text>
                  </HStack>
                </Button>
              </HStack>
            </VStack>
          </VStack>
        </Card>

        {/* Recent Activity */}
        <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
          <VStack space="$3">
            <Text fontSize="$5" fontWeight="bold" color="$color">
              Recent Activity
            </Text>

            <VStack space="$2">
              <HStack space="$3" padding="$3" backgroundColor="$background" borderRadius="$3">
                <Text fontSize="$4">ℹ️</Text>
                <VStack flex={1}>
                  <Text fontSize="$3" fontWeight="medium" color="$color">
                    Welcome to Penguin Pool!
                  </Text>
                  <Text fontSize="$2" color="$colorHover">
                    Just now
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  )
}
