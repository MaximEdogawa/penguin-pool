import { Button, Card, HStack, ScrollView, Text, VStack } from '@tamagui/core'
import React, { useCallback, useEffect, useState } from 'react'
import { RefreshControl } from 'react-native'
import { offersService } from '../../services/offersService'
import type { OfferDetails, OfferFilters } from '../../shared/types'

export function OffersScreen(): React.ReactElement {
  const [offers, setOffers] = useState<OfferDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [isCopied, setIsCopied] = useState<string | null>(null)
  const [filters, setFilters] = useState<OfferFilters>({ status: '' })

  const filteredOffers = offers.filter(offer => {
    if (filters.status && offer.status !== filters.status) {
      return false
    }
    return true
  })

  const refreshOffers = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      const fetchedOffers = await offersService.getOffers(filters)
      setOffers(fetchedOffers)
    } catch (_error) {
      // Handle refresh error
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true)
    await refreshOffers()
    setRefreshing(false)
  }

  const viewOffer = (_offer: OfferDetails): void => {
    // View offer
  }

  const cancelOffer = (_offer: OfferDetails): void => {
    // Cancel offer
    // Implement cancel offer logic
  }

  const copyOfferString = async (offerString: string): Promise<void> => {
    try {
      // In React Native, use Clipboard API
      // Copied offer string
      setIsCopied(offerString)
      setTimeout(() => setIsCopied(null), 2000)
    } catch (_error) {
      // Handle copy error
    }
  }

  const getStatusClass = (status: string): string => {
    const classes = {
      pending: '$yellow9',
      active: '$green9',
      completed: '$blue9',
      cancelled: '$red9',
      expired: '$gray9',
    }
    return classes[status as keyof typeof classes] || '$yellow9'
  }

  const formatDate = (date: Date): string => {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  }

  const formatAssetAmount = (amount: string, type: string): string => {
    // Format asset amount based on type
    const numAmount = parseFloat(amount)
    if (type === 'XCH') {
      return (numAmount / 1000000000000).toFixed(6)
    }
    return numAmount.toString()
  }

  const getTickerSymbol = (assetId: string): string => {
    const tickers: Record<string, string> = {
      xch: 'XCH',
      cat_token: 'CAT',
      usdc: 'USDC',
    }
    return tickers[assetId] || assetId.toUpperCase()
  }

  // Load offers on component mount
  useEffect(() => {
    refreshOffers()
  }, [refreshOffers])

  return (
    <ScrollView
      flex={1}
      backgroundColor="$background"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <VStack space="$4" padding="$4">
        {/* Header Actions */}
        <HStack space="$3" justifyContent="space-between">
          <Button
            size="$4"
            backgroundColor="$blue9"
            color="$blue1"
            onPress={() => {
              /* Show create offer modal */
            }}
            flex={1}
          >
            <HStack space="$2" alignItems="center">
              <Text fontSize="$4">➕</Text>
              <Text>Create Offer</Text>
            </HStack>
          </Button>

          <Button
            size="$4"
            backgroundColor="$green9"
            color="$green1"
            onPress={() => {
              /* Show take offer modal */
            }}
            flex={1}
          >
            <HStack space="$2" alignItems="center">
              <Text fontSize="$4">🛒</Text>
              <Text>Take Offer</Text>
            </HStack>
          </Button>

          <Button size="$4" variant="outlined" onPress={refreshOffers} disabled={isLoading}>
            <Text>{isLoading ? '⟳' : '↻'}</Text>
          </Button>
        </HStack>

        {/* Offers List */}
        <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
          <VStack space="$4">
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="bold" color="$color">
                My Offers
              </Text>
              <HStack space="$2">
                <Button size="$3" variant="outlined" onPress={() => setFilters({ status: '' })}>
                  All Status
                </Button>
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={() => setFilters({ status: 'active' })}
                >
                  Active
                </Button>
              </HStack>
            </HStack>

            {filteredOffers.length > 0 ? (
              <VStack space="$3">
                {filteredOffers.map(offer => (
                  <Card key={offer.id} padding="$4" backgroundColor="$background" borderRadius="$3">
                    <VStack space="$3">
                      {/* Header with Offer String and Status */}
                      <HStack justifyContent="space-between" alignItems="center">
                        <Button
                          size="$3"
                          variant="outlined"
                          onPress={() => copyOfferString(offer.offerString)}
                          backgroundColor={
                            isCopied === offer.offerString ? '$green9' : '$backgroundHover'
                          }
                        >
                          <Text fontSize="$2" fontFamily="$mono">
                            {offer.offerString.slice(0, 12)}...
                          </Text>
                        </Button>
                        <Text
                          fontSize="$2"
                          color={getStatusClass(offer.status)}
                          backgroundColor={`${getStatusClass(offer.status)}20`}
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                        >
                          {offer.status}
                        </Text>
                      </HStack>

                      {/* Assets Section */}
                      <VStack space="$2">
                        <Text fontSize="$3" fontWeight="medium" color="$color">
                          Assets Offered ({offer.assetsOffered?.length || 0})
                        </Text>
                        {offer.assetsOffered?.slice(0, 3).map((asset, index) => (
                          <HStack key={index} justifyContent="space-between">
                            <Text fontSize="$2" fontWeight="medium">
                              {formatAssetAmount(asset.amount, asset.type)}
                            </Text>
                            <Text fontSize="$2" color="$colorHover">
                              {getTickerSymbol(asset.assetId)}
                            </Text>
                          </HStack>
                        ))}
                        {(offer.assetsOffered?.length || 0) > 3 && (
                          <Text fontSize="$2" color="$blue9">
                            +{(offer.assetsOffered?.length || 0) - 3} more assets
                          </Text>
                        )}
                      </VStack>

                      {/* Footer with Date and Actions */}
                      <HStack
                        justifyContent="space-between"
                        alignItems="center"
                        paddingTop="$2"
                        borderTopWidth={1}
                        borderTopColor="$borderColor"
                      >
                        <Text fontSize="$2" color="$colorHover">
                          {formatDate(offer.createdAt)}
                        </Text>
                        <HStack space="$2">
                          <Button size="$2" variant="ghost" onPress={() => viewOffer(offer)}>
                            <Text fontSize="$2" color="$blue9">
                              View
                            </Text>
                          </Button>
                          {offer.status === 'active' && (
                            <Button size="$2" variant="ghost" onPress={() => cancelOffer(offer)}>
                              <Text fontSize="$2" color="$red9">
                                Cancel
                              </Text>
                            </Button>
                          )}
                        </HStack>
                      </HStack>
                    </VStack>
                  </Card>
                ))}
              </VStack>
            ) : (
              <VStack space="$4" alignItems="center" padding="$6">
                <Text fontSize="$8">🛍️</Text>
                <Text fontSize="$4" fontWeight="bold" color="$color">
                  No offers found
                </Text>
                <Text fontSize="$3" color="$colorHover" textAlign="center">
                  Create your first offer to start trading
                </Text>
                <Button
                  size="$4"
                  backgroundColor="$blue9"
                  color="$blue1"
                  onPress={() => {
                    /* Show create offer modal */
                  }}
                >
                  Create Offer
                </Button>
              </VStack>
            )}
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  )
}
