<template>
  <div v-if="isOpen" class="wallet-connect-modal-overlay" @click="handleOverlayClick">
    <div class="wallet-connect-modal" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">Connect Wallet</h2>
        <button @click="close" class="close-button">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <!-- QR Code Section -->
        <div v-if="showQRCode" class="qr-section">
          <div class="qr-container">
            <div class="qr-code" ref="qrCodeRef"></div>
          </div>
          <p class="qr-instructions">Scan this QR code with your wallet app to connect</p>
          <div class="qr-actions">
            <button @click="copyToClipboard" class="copy-button">
              <i class="pi pi-copy"></i>
              Copy Link
            </button>
          </div>
        </div>

        <!-- Wallet Options -->
        <div v-else class="wallet-options">
          <div class="wallet-option" @click="connectChiaWallet">
            <div class="wallet-icon">
              <i class="pi pi-wallet"></i>
            </div>
            <div class="wallet-info">
              <h3>Chia Wallet</h3>
              <p>Connect with Chia reference wallet</p>
            </div>
            <div class="wallet-arrow">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>

          <div class="wallet-option" @click="connectSageWallet">
            <div class="wallet-icon">
              <i class="pi pi-mobile"></i>
            </div>
            <div class="wallet-info">
              <h3>Sage Wallet</h3>
              <p>Connect with Sage mobile wallet</p>
            </div>
            <div class="wallet-arrow">
              <i class="pi pi-arrow-right"></i>
            </div>
          </div>
        </div>

        <!-- Connection Status -->
        <div v-if="isConnecting" class="connection-status">
          <div class="loading-spinner">
            <i class="pi pi-spin pi-spinner"></i>
          </div>
          <p>{{ connectionStatus }}</p>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">
          <i class="pi pi-exclamation-triangle"></i>
          <p>{{ error }}</p>
          <button @click="clearError" class="dismiss-button">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <p class="help-text">
          Don't have a wallet?
          <a
            href="https://docs.chia.net/walletconnect-developer-guide/"
            target="_blank"
            rel="noopener"
          >
            Learn more about supported wallets
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
  import { useWalletConnectStore } from '../stores/walletConnectStore'
  import QRCode from 'qrcode'

  interface Props {
    isOpen: boolean
  }

  interface Emits {
    (e: 'close'): void
    (e: 'connected', session: unknown): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const walletConnectStore = useWalletConnectStore()
  const qrCodeRef = ref<HTMLElement>()

  // State
  const showQRCode = ref(false)
  const qrCodeData = ref('')
  const connectionStatus = ref('')

  // Computed
  const isConnecting = computed(() => walletConnectStore.isConnecting)
  const error = computed(() => walletConnectStore.error)

  // Methods
  const close = () => {
    emit('close')
    resetModal()
  }

  const handleOverlayClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      close()
    }
  }

  const connectChiaWallet = async () => {
    try {
      showQRCode.value = true
      connectionStatus.value = 'Generating QR code...'

      // Start the connection process and get URI
      const connectionData = await walletConnectStore.startConnection()

      if (connectionData) {
        qrCodeData.value = connectionData.uri
        connectionStatus.value = 'Scan QR code with your Chia wallet app'

        // Check if this is demo mode
        const isDemoMode = connectionData.uri.includes('demo-connection-uri-for-testing')
        if (isDemoMode) {
          connectionStatus.value =
            'Demo Mode: This is a test QR code. Connection will be simulated in 5 seconds...'

          // Simulate connection after 5 seconds in demo mode
          setTimeout(async () => {
            try {
              const result = await walletConnectStore.connect()
              if (result.success) {
                connectionStatus.value = 'Demo Mode: Simulated connection successful!'
                emit('connected', result.session)
                setTimeout(() => close(), 1000)
              } else {
                connectionStatus.value = `Demo Mode: ${result.error}`
              }
            } catch (err) {
              connectionStatus.value = `Demo Mode: ${err}`
            }
          }, 5000)
        } else {
          // Real WalletConnect - wait for approval
          try {
            const approvedSession = await connectionData.approval()

            // Update store state
            walletConnectStore.session = approvedSession
            walletConnectStore.accounts = extractAccountsFromSession(approvedSession)
            walletConnectStore.isConnected = true

            connectionStatus.value = 'Connection successful!'
            emit('connected', approvedSession)
            setTimeout(() => close(), 1000)
          } catch (approvalError) {
            console.error('Connection approval failed:', approvalError)
            connectionStatus.value = 'Connection was rejected or failed'
            showQRCode.value = false
          }
        }

        // Generate QR code
        await generateQRCode(connectionData.uri)
      } else {
        connectionStatus.value = 'Failed to generate connection link'
        showQRCode.value = false
      }
    } catch (err) {
      console.error('Chia Wallet connection failed:', err)
      connectionStatus.value = 'Connection failed'
      showQRCode.value = false
    }
  }

  const connectSageWallet = async () => {
    try {
      connectionStatus.value = 'Opening Sage Wallet...'

      // For now, redirect to Sage Wallet or show instructions
      // This would be implemented based on Sage Wallet's deep linking
      window.open('sage://wallet', '_blank')

      connectionStatus.value = 'Please complete connection in Sage Wallet'
    } catch (err) {
      console.error('Sage Wallet connection failed:', err)
      connectionStatus.value = 'Sage Wallet connection failed'
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeData.value)
      connectionStatus.value = 'Link copied to clipboard!'
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      connectionStatus.value = 'Failed to copy link'
    }
  }

  const clearError = () => {
    walletConnectStore.clearError()
  }

  const resetModal = () => {
    showQRCode.value = false
    qrCodeData.value = ''
    connectionStatus.value = ''
  }

  // Helper function to extract accounts from session
  const extractAccountsFromSession = (session: unknown): string[] => {
    const accounts: string[] = []

    if (session && typeof session === 'object' && 'namespaces' in session) {
      const sessionObj = session as { namespaces: Record<string, { accounts?: string[] }> }
      Object.values(sessionObj.namespaces).forEach(namespace => {
        if (namespace.accounts) {
          accounts.push(...namespace.accounts)
        }
      })
    }

    return accounts
  }

  const generateQRCode = async (data: string) => {
    // Wait for the next DOM update cycle
    await nextTick()

    if (!qrCodeRef.value) {
      console.error('QR code ref not available')
      return
    }

    try {
      const qrCodeUrl = await QRCode.toDataURL(data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      qrCodeRef.value.innerHTML = `<img src="${qrCodeUrl}" alt="Wallet Connect QR Code" />`
    } catch (err) {
      console.error('Failed to generate QR code:', err)
    }
  }

  // Watch for QR code data changes
  watch(qrCodeData, newData => {
    if (newData) {
      generateQRCode(newData)
    }
  })

  // Watch for modal open/close
  watch(
    () => props.isOpen,
    isOpen => {
      if (isOpen) {
        // Reset modal state when opening
        showQRCode.value = false
        qrCodeData.value = ''
        connectionStatus.value = ''
      }
    }
  )

  // Watch for Wallet Connect events
  watch(
    () => walletConnectStore.session,
    newSession => {
      if (newSession) {
        emit('connected', newSession)
        close()
      }
    }
  )

  onMounted(() => {
    // Initialize Wallet Connect
    walletConnectStore.initialize()
  })

  onUnmounted(() => {
    // Cleanup if needed
  })
</script>

<style scoped>
  .wallet-connect-modal-overlay {
    @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4;
    background-color: rgba(0, 0, 0, 0.8) !important;
  }

  .wallet-connect-modal {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden;
  }

  .modal-header {
    @apply flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700;
  }

  .modal-title {
    @apply text-xl font-semibold text-gray-900 dark:text-white;
  }

  .close-button {
    @apply p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors;
  }

  .modal-content {
    @apply p-6 space-y-6;
  }

  .qr-section {
    @apply text-center space-y-4;
  }

  .qr-container {
    @apply flex justify-center;
  }

  .qr-code {
    @apply p-4 bg-white rounded-lg shadow-sm;
  }

  .qr-instructions {
    @apply text-sm text-gray-600 dark:text-gray-400;
  }

  .qr-actions {
    @apply flex justify-center;
  }

  .copy-button {
    @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2;
  }

  .wallet-options {
    @apply space-y-3;
  }

  .wallet-option {
    @apply flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors;
  }

  .wallet-icon {
    @apply w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-lg mr-4;
  }

  .wallet-icon i {
    @apply text-blue-600 dark:text-blue-400 text-xl;
  }

  .wallet-info {
    @apply flex-1;
  }

  .wallet-info h3 {
    @apply font-medium text-gray-900 dark:text-white;
  }

  .wallet-info p {
    @apply text-sm text-gray-600 dark:text-gray-400;
  }

  .wallet-arrow {
    @apply text-gray-400;
  }

  .connection-status {
    @apply flex flex-col items-center space-y-3 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg;
  }

  .loading-spinner {
    @apply text-blue-600 dark:text-blue-400;
  }

  .loading-spinner i {
    @apply text-2xl;
  }

  .connection-status p {
    @apply text-sm text-blue-800 dark:text-blue-200;
  }

  .error-message {
    @apply flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900 rounded-lg;
  }

  .error-message i {
    @apply text-red-600 dark:text-red-400 mt-0.5;
  }

  .error-message p {
    @apply text-sm text-red-800 dark:text-red-200 flex-1;
  }

  .dismiss-button {
    @apply text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200;
  }

  .modal-footer {
    @apply p-6 border-t border-gray-200 dark:border-gray-700;
  }

  .help-text {
    @apply text-xs text-gray-600 dark:text-gray-400 text-center;
  }

  .help-text a {
    @apply text-blue-600 dark:text-blue-400 hover:underline;
  }
</style>
