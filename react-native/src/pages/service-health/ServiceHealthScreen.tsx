import { Card, HStack, ScrollView, Text, VStack } from '@tamagui/core'
import React, { useCallback, useEffect, useState } from 'react'
import { RefreshControl } from 'react-native'
import { serviceHealthService } from '../../services/serviceHealthService'
import type { ServiceStatus } from '../../shared/types'

export function ServiceHealthScreen(): React.ReactElement {
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const refreshServices = useCallback(async (): Promise<void> => {
    setRefreshing(true)
    try {
      const serviceStatuses = await serviceHealthService.getServiceStatus()
      setServices(serviceStatuses)
    } catch (_error) {
      // Handle refresh error
    } finally {
      setRefreshing(false)
    }
  }, [])

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return '$green9'
      case 'degraded':
        return '$yellow9'
      case 'down':
        return '$red9'
      default:
        return '$gray9'
    }
  }

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'healthy':
        return '✅'
      case 'degraded':
        return '⚠️'
      case 'down':
        return '❌'
      default:
        return '❓'
    }
  }

  useEffect(() => {
    refreshServices()
  }, [refreshServices])

  return (
    <ScrollView
      flex={1}
      backgroundColor="$background"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshServices} />}
    >
      <VStack space="$4" padding="$4">
        {/* Header */}
        <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
          <VStack space="$3">
            <HStack space="$3" alignItems="center">
              <Text fontSize="$8">🏥</Text>
              <VStack flex={1}>
                <Text fontSize="$5" fontWeight="bold" color="$color">
                  Service Health
                </Text>
                <Text fontSize="$3" color="$colorHover">
                  Monitor system status and performance
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Card>

        {/* Services List */}
        <VStack space="$3">
          {services.map((service, index) => (
            <Card key={index} padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
              <VStack space="$3">
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack space="$3" alignItems="center">
                    <Text fontSize="$4">{getStatusIcon(service.status)}</Text>
                    <Text fontSize="$4" fontWeight="bold" color="$color">
                      {service.name}
                    </Text>
                  </HStack>
                  <Text
                    fontSize="$3"
                    color={getStatusColor(service.status)}
                    backgroundColor={`${getStatusColor(service.status)}20`}
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius="$2"
                  >
                    {service.status.toUpperCase()}
                  </Text>
                </HStack>

                <VStack space="$2" paddingTop="$2" borderTopWidth={1} borderTopColor="$borderColor">
                  <HStack justifyContent="space-between">
                    <Text fontSize="$2" color="$colorHover">
                      Last Check:
                    </Text>
                    <Text fontSize="$2" color="$color">
                      {service.lastCheck.toLocaleTimeString()}
                    </Text>
                  </HStack>

                  {service.responseTime && (
                    <HStack justifyContent="space-between">
                      <Text fontSize="$2" color="$colorHover">
                        Response Time:
                      </Text>
                      <Text fontSize="$2" color="$color">
                        {service.responseTime}ms
                      </Text>
                    </HStack>
                  )}

                  {service.error && (
                    <HStack justifyContent="space-between">
                      <Text fontSize="$2" color="$colorHover">
                        Error:
                      </Text>
                      <Text fontSize="$2" color="$red9">
                        {service.error}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </VStack>
            </Card>
          ))}
        </VStack>

        {/* System Info */}
        <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
          <VStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$color">
              System Information
            </Text>

            <VStack space="$3">
              <HStack justifyContent="space-between">
                <Text fontSize="$3" color="$colorHover">
                  App Version:
                </Text>
                <Text fontSize="$3" color="$color">
                  1.0.0
                </Text>
              </HStack>

              <HStack justifyContent="space-between">
                <Text fontSize="$3" color="$colorHover">
                  Platform:
                </Text>
                <Text fontSize="$3" color="$color">
                  React Native
                </Text>
              </HStack>

              <HStack justifyContent="space-between">
                <Text fontSize="$3" color="$colorHover">
                  Last Updated:
                </Text>
                <Text fontSize="$3" color="$color">
                  {new Date().toLocaleDateString()}
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  )
}
