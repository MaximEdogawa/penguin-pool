/**
 * Hook for managing iOS WalletConnect modal
 *
 * This hook listens for iOS modal events from the WalletConnectService
 * and manages the display of the custom iOS modal component.
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { useIOSWalletConnection } from '../composables/useIOSWalletConnection'

export function useIOSModal() {
  const { state: iosState } = useIOSWalletConnection()

  // Modal state
  const isModalVisible = ref(false)
  const modalUri = ref('')

  // Event handlers
  const handleShowIOSModal = (event: CustomEvent) => {
    if (iosState.value.isIOS) {
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
    if (iosState.value.isIOS) {
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
    isIOS: iosState.value.isIOS,
  }
}
