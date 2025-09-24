/**
 * Hook for managing iOS WalletConnect modal
 *
 * This hook listens for iOS modal events from the WalletConnectService
 * and manages the display of the custom iOS modal component.
 */

import { onMounted, onUnmounted, ref } from 'vue'

// iOS detection utility
const detectIOS = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase()
  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function useIOSModal() {
  const isIOS = detectIOS()

  // Modal state
  const isModalVisible = ref(false)
  const modalUri = ref('')

  // Event handlers
  const handleShowIOSModal = (event: CustomEvent) => {
    if (isIOS) {
      console.log('🍎 Showing iOS modal via event:', event.detail)
      modalUri.value = event.detail.uri
      isModalVisible.value = true
    }
  }

  const handleHideIOSModal = () => {
    console.log('🍎 Hiding iOS modal via event')
    isModalVisible.value = false
    modalUri.value = ''
  }

  const closeModal = () => {
    isModalVisible.value = false
    modalUri.value = ''
  }

  // Set up event listeners
  onMounted(() => {
    if (isIOS) {
      window.addEventListener('show_ios_modal', handleShowIOSModal as EventListener)
      window.addEventListener('hide_ios_modal', handleHideIOSModal as EventListener)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('show_ios_modal', handleShowIOSModal as EventListener)
    window.removeEventListener('hide_ios_modal', handleHideIOSModal as EventListener)
  })

  return {
    isModalVisible,
    modalUri,
    closeModal,
    isIOS,
  }
}
