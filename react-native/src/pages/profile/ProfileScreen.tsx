import { Button, Card, HStack, ScrollView, Text, VStack } from '@tamagui/core'
import React, { useState } from 'react'
import { useAuthStore } from '../../entities/user/model/useAuthStore'
import { useThemeStore } from '../../stores/themeStore'

export function ProfileScreen(): React.ReactElement {
  const { user, logout } = useAuthStore()
  const { mode, toggleMode } = useThemeStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (_error) {
      // Handle logout error
    } finally {
      setIsLoggingOut(false)
    }
  }

  const updateProfile = (): void => {
    // Update profile
  }

  const updatePreferences = (): void => {
    // Update preferences
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <VStack space="$4" padding="$4">
        {/* User Info */}
        <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
          <VStack space="$4">
            <HStack space="$3" alignItems="center">
              <Text fontSize="$8">👤</Text>
              <VStack flex={1}>
                <Text fontSize="$5" fontWeight="bold" color="$color">
                  {user?.name || 'Penguin User'}
                </Text>
                <Text fontSize="$3" color="$colorHover">
                  {user?.email || 'user@penguinpool.com'}
                </Text>
              </VStack>
            </HStack>

            <VStack space="$2" paddingTop="$3" borderTopWidth={1} borderTopColor="$borderColor">
              <HStack justifyContent="space-between">
                <Text fontSize="$3" color="$colorHover">
                  Wallet Address:
                </Text>
                <Text fontSize="$3" fontFamily="$mono" color="$color">
                  {user?.walletAddress || 'Not connected'}
                </Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text fontSize="$3" color="$colorHover">
                  Member Since:
                </Text>
                <Text fontSize="$3" color="$color">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </Card>

        {/* Settings */}
        <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
          <VStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$color">
              Settings
            </Text>

            <VStack space="$3">
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" color="$color">
                  Theme
                </Text>
                <Button size="$3" variant="outlined" onPress={toggleMode}>
                  <HStack space="$2" alignItems="center">
                    <Text>{mode === 'light' ? '🌙' : '☀️'}</Text>
                    <Text>{mode === 'light' ? 'Dark' : 'Light'}</Text>
                  </HStack>
                </Button>
              </HStack>

              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" color="$color">
                  Language
                </Text>
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={() => {
                    /* Change language */
                  }}
                >
                  <Text>English</Text>
                </Button>
              </HStack>

              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" color="$color">
                  Currency
                </Text>
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={() => {
                    /* Change currency */
                  }}
                >
                  <Text>XCH</Text>
                </Button>
              </HStack>
            </VStack>
          </VStack>
        </Card>

        {/* Notifications */}
        <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
          <VStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$color">
              Notifications
            </Text>

            <VStack space="$3">
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" color="$color">
                  Push Notifications
                </Text>
                <Button size="$3" variant="outlined" backgroundColor="$green9" color="$green1">
                  <Text>On</Text>
                </Button>
              </HStack>

              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" color="$color">
                  Email Notifications
                </Text>
                <Button size="$3" variant="outlined" backgroundColor="$gray9" color="$gray1">
                  <Text>Off</Text>
                </Button>
              </HStack>
            </VStack>
          </VStack>
        </Card>

        {/* Privacy */}
        <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
          <VStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$color">
              Privacy
            </Text>

            <VStack space="$3">
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" color="$color">
                  Share Analytics
                </Text>
                <Button size="$3" variant="outlined" backgroundColor="$gray9" color="$gray1">
                  <Text>Off</Text>
                </Button>
              </HStack>

              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" color="$color">
                  Share Usage Data
                </Text>
                <Button size="$3" variant="outlined" backgroundColor="$gray9" color="$gray1">
                  <Text>Off</Text>
                </Button>
              </HStack>
            </VStack>
          </VStack>
        </Card>

        {/* Actions */}
        <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
          <VStack space="$4">
            <Text fontSize="$5" fontWeight="bold" color="$color">
              Actions
            </Text>

            <VStack space="$3">
              <Button size="$4" backgroundColor="$blue9" color="$blue1" onPress={updateProfile}>
                <Text>Update Profile</Text>
              </Button>

              <Button
                size="$4"
                backgroundColor="$orange9"
                color="$orange1"
                onPress={updatePreferences}
              >
                <Text>Update Preferences</Text>
              </Button>

              <Button
                size="$4"
                backgroundColor="$red9"
                color="$red1"
                onPress={handleLogout}
                disabled={isLoggingOut}
              >
                <Text>{isLoggingOut ? 'Logging out...' : 'Logout'}</Text>
              </Button>
            </VStack>
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  )
}
