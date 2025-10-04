import { Button, HStack, Separator, Text, VStack } from '@tamagui/core'
import React from 'react'
import { ScrollView } from 'react-native'
import { useAuthStore } from '../../entities/user/model/useAuthStore'

interface SidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', path: '/dashboard' },
  { id: 'offers', label: 'Offers', icon: '📋', path: '/offers', badge: '12' },
  { id: 'contracts', label: 'Contracts', icon: '📄', path: '/contracts' },
  { id: 'loans', label: 'Loans', icon: '💰', path: '/loans' },
  { id: 'piggy-bank', label: 'Piggy Bank', icon: '🐷', path: '/piggy-bank' },
  { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' },
]

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps): React.ReactElement {
  const { walletAddress, isAuthenticated } = useAuthStore()

  return (
    <VStack
      width={isCollapsed ? 64 : 280}
      backgroundColor="$backgroundHover"
      borderRightWidth={1}
      borderRightColor="$borderColor"
      padding="$3"
      shadowColor="$shadowColor"
      shadowOffset={{ width: 2, height: 0 }}
      shadowOpacity={0.1}
      shadowRadius={4}
      elevation={3}
    >
      {/* Logo Section */}
      <VStack space="$3" alignItems={isCollapsed ? 'center' : 'flex-start'}>
        <HStack space="$2" alignItems="center">
          <Text fontSize="$6">🐧</Text>
          {!isCollapsed && (
            <VStack>
              <Text fontSize="$5" fontWeight="bold" color="$color">
                Penguin Pool
              </Text>
              <Text fontSize="$2" color="$colorHover">
                DeFi Platform
              </Text>
            </VStack>
          )}
        </HStack>

        {!isCollapsed && (
          <Button size="$2" variant="ghost" onPress={onToggleCollapse}>
            Collapse
          </Button>
        )}
      </VStack>

      <Separator marginVertical="$3" />

      {/* Navigation Menu */}
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space="$2">
          {navigationItems.map(item => (
            <Button
              key={item.id}
              variant="ghost"
              justifyContent={isCollapsed ? 'center' : 'flex-start'}
              padding="$3"
              borderRadius="$3"
            >
              <HStack space="$2" alignItems="center">
                <Text fontSize="$4">{item.icon}</Text>
                {!isCollapsed && (
                  <>
                    <Text flex={1} color="$color">
                      {item.label}
                    </Text>
                    {item.badge && (
                      <Text
                        backgroundColor="$red9"
                        color="$red1"
                        fontSize="$1"
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                      >
                        {item.badge}
                      </Text>
                    )}
                  </>
                )}
              </HStack>
            </Button>
          ))}
        </VStack>
      </ScrollView>

      <Separator marginVertical="$3" />

      {/* Wallet Status */}
      <VStack space="$2" alignItems={isCollapsed ? 'center' : 'flex-start'}>
        <HStack space="$2" alignItems="center">
          <Text fontSize="$2" color={isAuthenticated ? '$green9' : '$red9'}>
            {isAuthenticated ? '🟢' : '🔴'}
          </Text>
          {!isCollapsed && (
            <Text fontSize="$2" color="$colorHover">
              {isAuthenticated ? 'Connected' : 'Disconnected'}
            </Text>
          )}
        </HStack>

        {!isCollapsed && walletAddress && (
          <Text fontSize="$1" color="$colorHover" fontFamily="$mono">
            {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
          </Text>
        )}
      </VStack>
    </VStack>
  )
}
