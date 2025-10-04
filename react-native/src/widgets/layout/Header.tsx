import { Button, HStack, Input, Text, useMedia } from '@tamagui/core'
import React, { useState } from 'react'
import { ThemeToggle } from '../../features/theme/ui/ThemeToggle'

interface HeaderProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export function Header({ onToggleSidebar }: HeaderProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('')
  const media = useMedia()

  return (
    <HStack
      backgroundColor="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      padding="$3"
      alignItems="center"
      justifyContent="space-between"
    >
      {/* Left Section */}
      <HStack space="$3" alignItems="center">
        <Button size="$3" variant="ghost" onPress={onToggleSidebar}>
          ☰
        </Button>

        {/* Responsive Search */}
        {media.sm && (
          <Input
            placeholder="Search offers, contracts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            width={300}
            backgroundColor="$backgroundHover"
            borderColor="$borderColor"
          />
        )}
      </HStack>

      {/* Right Section */}
      <HStack space="$3" alignItems="center">
        {/* Notifications */}
        <Button size="$3" variant="ghost">
          🔔
          <Text
            backgroundColor="$red9"
            color="$red1"
            fontSize="$1"
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
            position="absolute"
            top={-5}
            right={-5}
          >
            3
          </Text>
        </Button>

        {/* Theme Controls */}
        <ThemeToggle />

        {/* User Profile */}
        <Button size="$3" variant="ghost">
          👤
        </Button>
      </HStack>
    </HStack>
  )
}
