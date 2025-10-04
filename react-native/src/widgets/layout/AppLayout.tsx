import { HStack, VStack, useMedia } from '@tamagui/core'
import React, { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DashboardScreen } from '../../pages/dashboard/DashboardScreen'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout({
  children: _children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const media = useMedia()
  const insets = useSafeAreaInsets()

  // Responsive sidebar behavior
  const shouldShowSidebar = media.sm ? sidebarOpen : false
  const sidebarWidth = sidebarCollapsed ? 64 : 280

  return (
    <HStack flex={1} backgroundColor="$background">
      {/* Responsive Sidebar */}
      {shouldShowSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Main Content Area */}
      <VStack flex={1} marginLeft={shouldShowSidebar ? sidebarWidth : 0}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        <VStack flex={1} padding="$4" paddingTop={insets.top}>
          <DashboardScreen />
        </VStack>
      </VStack>
    </HStack>
  )
}
