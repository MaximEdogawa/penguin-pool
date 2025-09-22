<template>
  <!-- This component just triggers the connection and shows minimal feedback -->
  <div v-if="isOpen" class="wallet-connect-overlay">
    <!-- Only show loading/success states, let WalletConnect handle the QR code -->
    <div v-if="isConnecting && !isConnected" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <h3>Connecting to wallet...</h3>
        <p>Please wait while we establish the connection</p>
      </div>
    </div>

    <div v-else-if="isConnected" class="success-overlay">
      <div class="success-content">
        <div class="success-icon">
          <i class="pi pi-check-circle"></i>
        </div>
        <h3>Connected Successfully!</h3>
        <p>Processing wallet information...</p>
      </div>
    </div>

    <div v-if="error" class="error-overlay">
      <div class="error-content">
        <div class="error-icon">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <h4>Connection Error</h4>
        <p>{{ error }}</p>
        <button @click="handleRetry" class="retry-button">
          <i class="pi pi-refresh"></i>
          Try Again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted } from 'vue'
  import { useWalletConnect } from '../composables/useWalletConnect'
  import { useWalletRequestService } from '../composables/useWalletRequestService'
  import type { ExtendedWalletInfo } from '../types/walletConnect.types'

  interface Props {
    isOpen: boolean
  }

  interface Emits {
    (e: 'close'): void
    (e: 'connected', walletInfo: ExtendedWalletInfo): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const { isConnected, isConnecting, error, connect } = useWalletConnect()
  const { getWalletInfo } = useWalletRequestService()

  // Methods
  const closeModal = () => {
    emit('close')
  }

  const handleConnect = async () => {
    try {
      console.log('🔗 Starting WalletConnect connection...')
      const result = await connect()

      if (result.success && result.session) {
        console.log('✅ Wallet connected successfully')

        // Get wallet information using the service method
        const walletInfo = getWalletInfo()

        console.log('📝 Wallet info extracted:', walletInfo)

        // Emit connected event with complete wallet info
        emit('connected', walletInfo)

        // Close modal after successful connection
        setTimeout(() => {
          closeModal()
        }, 2000) // Show success message for 2 seconds
      } else {
        console.error('❌ Connection failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Connection error:', error)
    }
  }

  const handleRetry = () => {
    // Reset error and try connecting again
    handleConnect()
  }

  // Handle escape key
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.isOpen) {
      closeModal()
    }
  }

  // Lifecycle
  onMounted(async () => {
    document.addEventListener('keydown', handleKeydown)

    // Automatically start connection process when modal opens
    if (props.isOpen && !isConnected.value && !isConnecting.value) {
      await handleConnect()
    }
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
</script>

<style scoped>
  .wallet-connect-overlay {
    @apply fixed inset-0 z-50 flex items-center justify-center;
  }

  .loading-overlay,
  .success-overlay,
  .error-overlay {
    @apply fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50;
  }

  .loading-content,
  .success-content,
  .error-content {
    @apply bg-white dark:bg-gray-800 rounded-lg p-8 max-w-sm mx-4 text-center shadow-xl;
  }

  .spinner {
    @apply w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4;
  }

  .success-icon {
    @apply w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4;
  }

  .success-icon i {
    @apply text-2xl text-green-600 dark:text-green-400;
  }

  .error-icon {
    @apply w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4;
  }

  .error-icon i {
    @apply text-2xl text-red-600 dark:text-red-400;
  }

  h3 {
    @apply text-xl font-semibold text-gray-900 dark:text-white mb-2;
  }

  h4 {
    @apply text-lg font-semibold text-gray-900 dark:text-white mb-2;
  }

  p {
    @apply text-sm text-gray-600 dark:text-gray-400 mb-4;
  }

  .retry-button {
    @apply px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto;
  }

  .retry-button i {
    @apply text-sm;
  }
</style>
