<template>
  <PrimeDialog
    :visible="isOpen"
    modal
    :closable="false"
    :dismissable-mask="true"
    :draggable="false"
    :resizable="false"
    class="wallet-connect-dialog"
    @hide="handleClose"
    @update:visible="handleClose"
    pt:root:class="!border-0 !bg-transparent"
    pt:mask:class="backdrop-blur-sm"
  >
    <template #container>
      <div class="wallet-connect-container">
        <!-- Connection Status -->
        <div v-if="currentStep === 'connecting'" class="connection-status text-center p-8">
          <div class="spinner"></div>
          <h3>Connecting to {{ selectedWallet?.name }}...</h3>
          <p>Please wait while we establish the connection</p>
        </div>

        <!-- QR Code Display -->
        <div v-else-if="currentStep === 'qr-code'" class="qr-section">
          <div class="qr-main-content">
            <!-- Wallet Icon and Title -->
            <div class="wallet-header-section">
              <div class="wallet-icon-large">
                <i :class="selectedWallet?.iconClass"></i>
              </div>
              <h3>Connect with {{ selectedWallet?.name }}</h3>
            </div>

            <!-- QR Code -->
            <div class="qr-container">
              <div class="qr-wrapper">
                <div v-if="qrCodeDataUrl" class="qr-code">
                  <div class="qr-code-border">
                    <img :src="qrCodeDataUrl" alt="Wallet Connect QR Code" />
                  </div>
                  <div class="qr-code-overlay">
                    <div class="scanning-indicator">
                      <div class="scan-line"></div>
                    </div>
                  </div>
                </div>
                <div v-else class="qr-placeholder">
                  <div class="qr-spinner-container">
                    <div class="qr-spinner"></div>
                    <p>Generating QR Code...</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Wallet Connect Code -->
            <div class="connection-options">
              <p class="qr-instruction">Scan the QR code with your mobile wallet</p>

              <div class="uri-section">
                <div class="uri-input-container">
                  <input
                    :value="connectionUri"
                    readonly
                    class="uri-input"
                    @click="selectUri"
                    placeholder="Connection URI"
                  />
                  <button
                    @click="copyUri"
                    @touchstart="handleTouchStart"
                    @touchend="handleTouchEnd"
                    class="copy-button"
                    :class="{ copied: isCopied }"
                    type="button"
                  >
                    <i :class="isCopied ? 'pi pi-check text-sm' : 'pi pi-copy text-sm'"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Download Link -->
            <div class="wallet-download-section">
              <a href="https://sagewallet.net/" target="_blank" class="download-link">
                <i class="pi pi-download text-sm"></i>
                <span>Don't have {{ selectedWallet?.name }}? Download it here</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <div v-else-if="currentStep === 'error'" class="error-section text-center p-8">
          <div class="error-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <h3>Connection Failed</h3>
          <p>{{ error }}</p>
          <div class="error-actions">
            <button @click="handleRetryConnection" class="retry-button">
              <i class="pi pi-refresh"></i>
              Try Again
            </button>
          </div>
        </div>

        <!-- Processing Display -->
        <div v-else-if="currentStep === 'processing'" class="processing-section text-center p-8">
          <div class="processing-animation">
            <div class="loading-spinner">
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
            </div>
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <h3>Processing Connection...</h3>
          <p>Setting up your account and loading wallet information</p>
          <div class="progress-container mt-6">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: processingProgress + '%' }"></div>
            </div>
            <div class="progress-text text-sm text-gray-600 mt-2">
              {{ processingMessage }}
            </div>
          </div>
        </div>

        <!-- Success Display -->
        <div v-else-if="currentStep === 'success'" class="success-section text-center p-8">
          <div class="success-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <h3>Connected Successfully!</h3>
          <p>Your {{ selectedWallet?.name }} is now connected to Penguin Pool</p>
          <div v-if="walletInfo" class="wallet-info">
            <div class="info-item">
              <span class="label">Address:</span>
              <span class="value">{{ formatAddress(walletInfo.address) }}</span>
            </div>
            <div class="info-item">
              <span class="label">Balance:</span>
              <span class="value"
                >{{
                  walletInfo.balance
                    ? formatBalance(parseInt(walletInfo.balance.confirmed))
                    : '0.000000'
                }}
                XCH</span
              >
            </div>
          </div>
          <div class="success-actions mt-8">
            <p class="redirect-message">
              <i class="pi pi-spin pi-spinner"></i>
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button v-if="currentStep === 'selection'" @click="closeModal" class="cancel-button">
          Cancel
        </button>
        <button v-else-if="currentStep === 'qr-code'" @click="handleClose" class="back-button">
          <i class="pi pi-arrow-left"></i>
          Back
        </button>
        <button v-else-if="currentStep === 'error'" @click="handleClose" class="back-button">
          <i class="pi pi-arrow-left"></i>
          Back
        </button>
        <button v-else-if="currentStep === 'success'" @click="closeModal" class="done-button">
          <i class="pi pi-check text-base"></i>
          Done
        </button>
      </div>
    </template>
  </PrimeDialog>
</template>

<script setup lang="ts">
  import { sessionManager } from '@/shared/services/sessionManager'
  import QRCode from 'qrcode'
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { useWalletConnectService } from '../services/WalletConnectService'
  import { useWalletConnectStore } from '../stores/walletConnectStore'
  import type { WalletInfo } from '../types/walletConnect.types'

  interface WalletOption {
    id: string
    name: string
    description: string
    iconClass: string
    available: boolean
    type: 'sage' | 'chia' | 'other'
  }

  interface Props {
    isOpen: boolean
  }

  interface Emits {
    (e: 'close'): void
    (e: 'connected', walletInfo: WalletInfo): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // Store
  const walletStore = useWalletConnectStore()
  const walletService = useWalletConnectService

  // State
  const currentStep = ref<
    'selection' | 'connecting' | 'qr-code' | 'processing' | 'error' | 'success'
  >('qr-code')
  const selectedWallet = ref<WalletOption | null>(null)
  const connectionUri = ref<string | null>(null)
  const qrCodeDataUrl = ref<string | null>(null)
  const isConnecting = ref(false)
  const error = ref<string | null>(null)
  const isCopied = ref(false)
  const processingProgress = ref(0)
  const processingMessage = ref('Initializing...')
  const currentApprovalFunction = ref<(() => Promise<unknown>) | null>(null)

  // Computed
  const walletInfo = computed(() => walletStore.walletInfo)

  // Methods
  const closeModal = () => {
    resetModal()
    emit('close')
  }

  const handleClose = () => {
    closeModal()
  }

  const resetModal = () => {
    currentStep.value = 'selection'
    selectedWallet.value = null
    connectionUri.value = null
    qrCodeDataUrl.value = null
    isConnecting.value = false
    error.value = null
    processingProgress.value = 0
    processingMessage.value = 'Initializing...'
  }

  // Connection retry configuration
  const RETRY_CONFIG = {
    maxRetries: 5, // Increased from 3 to 5
    baseDelay: 2000, // Increased from 1s to 2s
    maxDelay: 15000, // Increased from 10s to 15s
    backoffMultiplier: 1.5, // Reduced from 2 to 1.5 for more gradual backoff
  }

  // Wallet approval timeout configuration
  const WALLET_APPROVAL_TIMEOUT = 30000 // 30 seconds for wallet approval

  // Error types for better error handling
  const ERROR_TYPES = {
    CONNECTION_FAILED: 'CONNECTION_FAILED',
    APPROVAL_FAILED: 'APPROVAL_FAILED',
    APPROVAL_TIMEOUT: 'APPROVAL_TIMEOUT',
    WALLET_INFO_FAILED: 'WALLET_INFO_FAILED',
    WEBSOCKET_DISCONNECTED: 'WEBSOCKET_DISCONNECTED',
    PAIRING_EXPIRED: 'PAIRING_EXPIRED',
    UNKNOWN: 'UNKNOWN',
  } as const

  type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES]

  // Utility function to calculate retry delay with exponential backoff
  const calculateRetryDelay = (attempt: number): number => {
    const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1)
    return Math.min(delay, RETRY_CONFIG.maxDelay)
  }

  // Utility function to sleep for a specified duration
  const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Utility function to update progress with smooth transitions
  const updateProgress = (progress: number, message: string) => {
    processingProgress.value = progress
    processingMessage.value = message
  }

  // Utility function to handle errors with proper typing
  const handleError = (err: unknown, errorType: ErrorType, context: string) => {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error(`${context} error:`, errorMessage)

    let userMessage: string
    switch (errorType) {
      case ERROR_TYPES.CONNECTION_FAILED:
        userMessage = 'Failed to establish connection. Please check your network and try again.'
        break
      case ERROR_TYPES.APPROVAL_FAILED:
        userMessage = 'Wallet connection was not approved. Please try again.'
        break
      case ERROR_TYPES.APPROVAL_TIMEOUT:
        userMessage = `Wallet approval timed out after ${WALLET_APPROVAL_TIMEOUT / 1000} seconds. Please try again.`
        break
      case ERROR_TYPES.WALLET_INFO_FAILED:
        userMessage = 'Connected but failed to fetch wallet information. Please try reconnecting.'
        break
      case ERROR_TYPES.WEBSOCKET_DISCONNECTED:
        userMessage = 'Connection lost. Attempting to reconnect...'
        break
      case ERROR_TYPES.PAIRING_EXPIRED:
        userMessage = 'Connection code expired. Please refresh to get a new code.'
        break
      default:
        userMessage = 'An unexpected error occurred. Please try again.'
    }

    error.value = userMessage
    currentStep.value = 'error'
    return userMessage
  }

  // Function to establish initial connection
  const establishConnection = async (): Promise<{
    uri: string
    approval: () => Promise<unknown>
  } | null> => {
    try {
      if (!walletService.isInitialized()) {
        console.log('Initializing wallet service before connection...')
        await walletService.initialize()
      }

      const connection = await walletStore.startConnection()

      if (!connection) {
        throw new Error('Failed to generate connection URI')
      }

      console.log('Connection URI generated:', connection.uri.substring(0, 50) + '...')
      return connection
    } catch (err) {
      handleError(err, ERROR_TYPES.CONNECTION_FAILED, 'Connection establishment')
      return null
    }
  }

  // Function to handle wallet approval with retry logic and timeout
  const handleWalletApproval = async (approval: () => Promise<unknown>): Promise<boolean> => {
    for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        console.log(`Wallet approval attempt ${attempt}/${RETRY_CONFIG.maxRetries}`)

        // Create a timeout promise that rejects after the specified timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Wallet approval timed out after ${WALLET_APPROVAL_TIMEOUT}ms`))
          }, WALLET_APPROVAL_TIMEOUT)
        })

        // Race between approval and timeout
        const session = await Promise.race([approval(), timeoutPromise])

        if (session) {
          console.log('Wallet connection approved:', session)
          return true
        }

        if (attempt < RETRY_CONFIG.maxRetries) {
          const delay = calculateRetryDelay(attempt)
          console.log(`Approval failed, retrying in ${delay}ms...`)
          await sleep(delay)
        }
      } catch (err) {
        console.error(`Approval attempt ${attempt} failed:`, err)

        if (attempt === RETRY_CONFIG.maxRetries) {
          // Check if it's a timeout error
          const isTimeout = err instanceof Error && err.message.includes('timed out')
          const errorType = isTimeout ? ERROR_TYPES.APPROVAL_TIMEOUT : ERROR_TYPES.APPROVAL_FAILED
          handleError(err, errorType, 'Wallet approval')
          return false
        }

        const delay = calculateRetryDelay(attempt)
        await sleep(delay)
      }
    }

    return false
  }

  const fetchWalletInfo = async (): Promise<boolean> => {
    try {
      updateProgress(40, 'Fetching wallet information...')

      if (!walletService.isConnected()) {
        console.log('Websocket disconnected, attempting to reconnect...')
        updateProgress(35, 'Reconnecting to wallet...')

        try {
          await walletService.initialize()
        } catch (reconnectErr) {
          console.warn('Websocket reconnection failed:', reconnectErr)
          throw new Error('Failed to reconnect to wallet service')
        }
      }

      const fetchedWalletInfo = await walletService.getWalletInfo()
      if (!fetchedWalletInfo) throw new Error('Failed to fetch wallet information')

      // Update store state to reflect successful connection
      walletStore.walletInfo = fetchedWalletInfo
      walletStore.isConnected = true
      walletStore.isConnecting = false
      walletStore.error = null
      walletStore.chainId = walletService.getNetworkInfo().chainId

      updateProgress(80, 'Finalizing connection...')
      await sleep(300)
      updateProgress(100, 'Connection complete!')
      await sleep(300)
      currentStep.value = 'success'
      emit('connected', fetchedWalletInfo)
      return true
    } catch (err) {
      console.error('Wallet info fetch failed:', err)
      handleError(err, ERROR_TYPES.WALLET_INFO_FAILED, 'Wallet info fetch')
      return false
    }
  }

  // Function to restart the approval process
  const restartApprovalProcess = async () => {
    console.log('Restarting approval process...')

    // Reset connection state
    currentStep.value = 'connecting'
    error.value = null
    isConnecting.value = true
    processingProgress.value = 0
    processingMessage.value = 'Restarting connection...'

    try {
      // Clear any existing session data
      await sessionManager.clearAllSessionData({
        clearWalletConnect: true,
        clearUserData: false,
        clearThemeData: false,
        clearPWAStorage: true,
        clearServiceWorker: true,
        clearAllCaches: false,
      })

      // Reinitialize the wallet service
      if (!walletService.isInitialized()) {
        await walletService.initialize()
      }

      // Start fresh connection
      const connection = await establishConnection()
      if (!connection) return

      // Generate new QR code
      connectionUri.value = connection.uri
      currentStep.value = 'qr-code'
      await generateQRCode(connection.uri)

      // Handle wallet approval with fresh retry logic
      updateProgress(20, 'Verifying connection...')
      await sleep(1000)

      const approvalSuccess = await handleWalletApproval(connection.approval)
      if (!approvalSuccess) return

      // Fetch wallet info
      currentStep.value = 'processing'
      const infoSuccess = await fetchWalletInfo()

      if (!infoSuccess) {
        return
      }
    } catch (err) {
      handleError(err, ERROR_TYPES.UNKNOWN, 'Approval restart')
    } finally {
      isConnecting.value = false
    }
  }

  const handleRetryConnection = async () => {
    // Check if it's a pairing expiry error
    if (error.value?.includes('expired')) {
      await refreshConnection()
    } else {
      // Use the new restart approval process for better reliability
      await restartApprovalProcess()
    }
  }

  // Function to refresh connection
  const refreshConnection = async () => {
    console.log('Refreshing connection...')

    try {
      // Show loading state
      currentStep.value = 'connecting'
      isConnecting.value = true
      error.value = null
      updateProgress(10, 'Refreshing connection code...')

      // Get new connection from service
      const newConnection = await walletService.startConnection()

      if (!newConnection) {
        throw new Error('Failed to start new connection')
      }

      // Update connection URI and QR code
      connectionUri.value = newConnection.uri
      await generateQRCode(newConnection.uri)
      currentApprovalFunction.value = newConnection.approval

      // Move to QR code step
      currentStep.value = 'qr-code'
      updateProgress(20, 'New code generated. Please try connecting again.')

      // Start approval process with new connection
      const approvalSuccess = await handleWalletApproval(newConnection.approval)
      if (!approvalSuccess) return

      // Continue with wallet info fetch
      currentStep.value = 'processing'
      const infoSuccess = await fetchWalletInfo()

      if (infoSuccess) {
        currentStep.value = 'success'
        emit('connected', walletStore.walletInfo!)
      }
    } catch (err) {
      console.error('Failed to refresh connection:', err)
      handleError(err, ERROR_TYPES.CONNECTION_FAILED, 'Connection refresh')
    } finally {
      isConnecting.value = false
    }
  }

  const copyUri = async () => {
    if (connectionUri.value) {
      try {
        // Try modern Clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(connectionUri.value)
        } else {
          // Fallback for older iOS versions or non-secure contexts
          const textArea = document.createElement('textarea')
          textArea.value = connectionUri.value
          textArea.style.position = 'fixed'
          textArea.style.left = '-999999px'
          textArea.style.top = '-999999px'
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()

          try {
            document.execCommand('copy')
          } catch (fallbackErr) {
            console.error('Fallback copy failed:', fallbackErr)
            // Show the URI in an alert as last resort
            alert(`Please copy this URI manually:\n\n${connectionUri.value}`)
            return
          } finally {
            document.body.removeChild(textArea)
          }
        }

        isCopied.value = true
        setTimeout(() => {
          isCopied.value = false
        }, 2000) // Reset after 2 seconds
      } catch (err) {
        console.error('Failed to copy URI:', err)
        // Show the URI in an alert as fallback
        alert(`Please copy this URI manually:\n\n${connectionUri.value}`)
      }
    }
  }

  const handleTouchStart = (event: TouchEvent) => {
    // Prevent default to avoid double-tap zoom on iOS
    event.preventDefault()
    // Add visual feedback for touch
    const button = event.currentTarget as HTMLButtonElement
    button.style.transform = 'scale(0.95)'
  }

  const handleTouchEnd = (event: TouchEvent) => {
    // Prevent default to avoid double-tap zoom on iOS
    event.preventDefault()
    // Reset visual feedback
    const button = event.currentTarget as HTMLButtonElement
    button.style.transform = 'scale(1)'
    // Trigger the copy action
    copyUri()
  }

  const selectUri = (event: Event) => {
    const input = event.target as HTMLInputElement
    input.select()
  }

  const formatBalance = (mojos: number): string => {
    return (mojos / 1000000000000).toFixed(6)
  }

  const formatAddress = (address: string): string => {
    if (address.length <= 20) return address
    return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`
  }

  // Generate QR code from URI
  const generateQRCode = async (uri: string) => {
    try {
      console.log('Generating QR code for URI:', uri.substring(0, 50) + '...')
      const dataUrl = await QRCode.toDataURL(uri, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
      qrCodeDataUrl.value = dataUrl
      console.log('QR code generated successfully')
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      qrCodeDataUrl.value = null
    }
  }

  // Handle escape key
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.isOpen) {
      closeModal()
    }
  }

  // Expose functions to parent component
  defineExpose({
    closeModal,
    handleClose,
    handleRetryConnection,
    restartApprovalProcess, // Expose the new restart function
  })

  onMounted(async () => {
    document.addEventListener('keydown', handleKeydown)
    window.addEventListener('wallet-connect-pairing-expired', handlePairingExpired as EventListener)
    window.addEventListener('ios-refresh-pairing', handleRefreshPairing as EventListener)
    await restartApprovalProcess()
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    window.removeEventListener(
      'wallet-connect-pairing-expired',
      handlePairingExpired as EventListener
    )
    window.removeEventListener('ios-refresh-pairing', handleRefreshPairing as EventListener)
  })

  // Listen for pairing expiry events
  const handlePairingExpired = (event: Event) => {
    const customEvent = event as CustomEvent
    console.log('Pairing expired:', customEvent.detail)
    handleError(
      new Error('Connection code expired. Please refresh to get a new code.'),
      ERROR_TYPES.PAIRING_EXPIRED,
      'Pairing expiry'
    )
  }

  const handleRefreshPairing = async (event: Event) => {
    const customEvent = event as CustomEvent
    console.log('Refreshing pairing...', customEvent.detail)
    await refreshConnection()
  }
</script>

<style scoped>
  /* Base Layout */
  .wallet-connect-container {
    @apply flex flex-col p-2 gap-4 rounded-2xl bg-stone-950 backdrop-blur-xl max-w-2xl w-[95vw] max-h-[95vh] overflow-hidden relative border border-white/10 mt-2;
  }

  .wallet-connect-dialog :deep(.p-dialog) {
    @apply max-w-none w-auto;
  }

  .wallet-connect-dialog :deep(.p-dialog-content) {
    @apply p-0;
  }

  /* Common Text Styles */
  .error-section h3 {
    @apply m-0 text-white font-semibold;
  }
  .wallet-header-section h3 {
    @apply text-sm leading-tight sm:text-base md:text-lg lg:text-xl xl:text-2xl;
  }
  .error-section h3 {
    @apply text-2xl mb-2;
  }

  .qr-instruction,
  .error-section p {
    @apply m-0 text-gray-300;
  }

  .qr-instruction {
    @apply mt-1 text-xs text-center;
  }
  .error-section p {
    @apply text-base mb-8;
  }

  /* Spinner Styles */
  .spinner,
  .qr-spinner {
    @apply w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4;
  }

  /* QR Code Section */
  .qr-section {
    @apply text-center flex flex-col items-center justify-center flex-1 min-h-0;
  }

  .qr-main-content {
    @apply flex flex-col items-center justify-center w-full gap-6;
  }

  .wallet-header-section {
    @apply flex flex-row items-center gap-3 text-center;
  }

  .wallet-icon-large {
    @apply w-6 h-6 rounded-xl bg-white/20 flex items-center justify-center;
  }

  .wallet-icon-large i {
    @apply text-white text-base;
  }

  .qr-container {
    @apply flex justify-center items-center flex-none;
  }

  .qr-wrapper {
    @apply relative inline-block;
  }

  .qr-placeholder {
    @apply flex flex-col items-center justify-center w-auto h-auto border border-gray-300 rounded-xl bg-gray-50 mx-auto relative overflow-hidden;
  }

  .qr-placeholder::before {
    content: '';
    @apply absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-transparent via-blue-500/10 to-transparent animate-pulse;
  }

  .qr-spinner-container {
    @apply flex flex-col items-center justify-center z-10 relative;
  }

  .qr-placeholder p {
    @apply m-0 text-gray-500 text-sm font-medium;
  }

  .qr-code {
    @apply relative inline-block rounded-xl overflow-hidden shadow-lg;
  }

  .qr-code-border {
    @apply bg-white/90 rounded-xl border border-white/30;
  }

  .qr-code img {
    @apply block w-full h-full rounded-lg;
  }

  .qr-code-overlay {
    @apply absolute inset-0 pointer-events-none rounded-2xl overflow-hidden;
  }

  .scanning-indicator {
    @apply absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-pulse;
  }

  .scan-line {
    @apply absolute top-0 -left-full w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse;
  }

  /* Connection Options */
  .connection-options {
    @apply flex flex-col gap-4 w-full max-w-md;
  }

  .uri-section {
    @apply bg-white/10 border border-white/30 rounded-lg p-3 backdrop-blur-sm;
  }

  .uri-input-container {
    @apply flex flex-row gap-2 items-center;
  }

  .uri-input {
    @apply flex-1 p-2 border border-white/30 rounded-md text-sm bg-white/10 text-white transition-all leading-tight font-mono;
  }

  .uri-input:focus {
    @apply outline-none border-white/50 shadow-[0_0_0_3px_rgba(255,255,255,0.1)];
  }

  .copy-button {
    @apply bg-white/20 text-white border border-white/30 p-2 rounded-md cursor-pointer font-medium transition-all flex items-center justify-center min-w-10 flex-shrink-0 hover:bg-white/30 hover:-translate-y-0.5 hover:shadow-lg;
    /* iOS-specific touch improvements */
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
    touch-action: manipulation;
    min-height: 44px; /* iOS minimum touch target */
    min-width: 44px;
  }

  .copy-button.copied {
    @apply bg-green-500/20 border-green-500/50 text-green-400;
    animation: copySuccess 0.6s ease-in-out;
  }

  @keyframes copySuccess {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  .wallet-download-section {
    @apply text-center mt-1 flex-shrink-0;
  }

  .download-link {
    @apply inline-flex items-center gap-1.5 text-white no-underline font-medium text-xs px-3 py-1.5 border border-white/30 rounded-md transition-all bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:text-white hover:-translate-y-0.5 hover:shadow-lg;
  }

  /* Error & Success Sections */
  .error-icon {
    @apply text-red-500 mb-4 text-6xl;
  }

  .error-actions {
    @apply flex gap-4 justify-center flex-wrap;
  }

  .retry-button {
    @apply bg-red-500 text-white border border-white/20 px-6 py-3 rounded-lg cursor-pointer font-medium transition-all flex items-center gap-2 shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(239,68,68,0.4)];
  }

  .success-icon {
    @apply text-emerald-500 mb-4 text-5xl;
  }

  .success-section h3 {
    @apply text-gray-900 text-xl mb-2;
  }

  .success-section p {
    @apply text-gray-500 mb-8;
  }

  .redirect-message {
    @apply text-gray-500 text-center flex items-center justify-center gap-2;
  }

  .wallet-info {
    @apply bg-gray-50 border border-gray-300 rounded-lg p-4 text-left;
  }

  .info-item {
    @apply flex justify-between mb-2 last:mb-0;
  }

  .info-item .label {
    @apply font-medium text-gray-700;
  }

  .info-item .value {
    @apply font-mono text-gray-500 break-all;
  }

  /* Modal Footer */
  .modal-footer {
    @apply pt-4 border-t border-white/20 flex justify-center gap-3 flex-shrink-0;
  }

  .cancel-button,
  .done-button,
  .back-button {
    @apply px-6 py-3 border border-white/30 rounded-lg font-medium cursor-pointer transition-all flex items-center gap-2 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:-translate-y-0.5 hover:shadow-lg;
  }

  /* Responsive Design using Tailwind breakpoints */
  .wallet-connect-container {
    @apply lg:max-w-xl xl:max-w-2xl md:p-6 md:gap-4 md:max-h-[95vh] md:max-w-lg sm:p-4 sm:gap-3 sm:max-h-[98vh] sm:max-w-sm;
  }

  .qr-main-content {
    @apply lg:gap-5;
  }

  .connection-options {
    @apply lg:max-w-lg lg:gap-4;
  }

  .wallet-connect-dialog :deep(.p-dialog) {
    @apply md:max-w-lg md:max-h-96;
  }

  .qr-section {
    @apply md:gap-2;
  }

  .qr-main-content {
    @apply md:gap-4;
  }

  .connection-options {
    @apply md:max-w-sm md:gap-3;
  }

  .qr-placeholder,
  .qr-code img {
    @apply w-[15rem] h-[15rem] sm:w-[15rem] sm:h-[15rem] md:w-[17rem] md:h-[17rem] lg:w-[18rem] lg:h-[18rem] xl:w-[18rem] xl:h-[18rem];
  }

  .qr-code-border {
    @apply md:p-3;
  }

  .wallet-icon-large {
    @apply sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14;
  }

  .wallet-icon-large i {
    @apply sm:text-lg md:text-xl lg:text-2xl xl:text-3xl;
  }

  .wallet-header-section {
    @apply md:gap-2 md:flex-row;
  }

  .wallet-header-section h3 {
    @apply md:text-xl;
  }

  .qr-section {
    @apply sm:p-2;
  }

  .wallet-header-section {
    @apply sm:gap-1 sm:flex-row;
  }

  .connection-options {
    @apply sm:max-w-xs sm:gap-2;
  }

  .qr-code-border {
    @apply sm:p-2;
  }

  .uri-section {
    @apply sm:p-2;
  }

  .uri-input-container {
    @apply sm:flex-row sm:gap-2;
  }

  .copy-button {
    @apply sm:min-w-8 sm:px-2;
  }

  .modal-footer {
    @apply sm:p-2 sm:px-4 sm:flex-col sm:gap-2;
  }

  .modal-footer button {
    @apply sm:w-full sm:justify-center;
  }

  .wallet-connect-dialog :deep(.p-dialog) {
    @apply sm:max-w-sm;
  }

  .qr-section {
    @apply sm:gap-2;
  }

  .qr-main-content {
    @apply sm:gap-3;
  }

  .connection-options {
    @apply sm:max-w-xs sm:gap-2;
  }

  .qr-code-border {
    @apply sm:p-2.5;
  }

  .wallet-header-section {
    @apply sm:gap-1 sm:flex-row;
  }

  /* Dark Mode */
  .wallet-connect-dialog :deep(.p-dialog) {
    @apply dark:bg-gray-800 dark:text-gray-50;
  }

  .wallet-header-section h3 {
    @apply dark:text-gray-50;
  }

  .qr-code-border {
    @apply dark:bg-gray-700 dark:border-gray-600;
  }

  .uri-section {
    @apply dark:bg-gray-700 dark:border-gray-600;
  }

  .uri-input {
    @apply dark:bg-gray-800 dark:border-gray-600 dark:text-gray-50;
  }

  .uri-input:focus {
    @apply dark:border-blue-500;
  }

  .download-link {
    @apply dark:text-blue-400 dark:border-blue-400 dark:bg-blue-500/10;
  }

  .download-link:hover {
    @apply dark:bg-blue-500 dark:text-white;
  }

  /* Processing Animation Styles */
  .processing-animation {
    @apply flex flex-col items-center gap-4 mb-6;
  }

  .loading-spinner {
    @apply relative w-16 h-16;
  }

  .spinner-ring {
    @apply absolute w-full h-full border-4 border-transparent rounded-full;
    animation: spin 1.5s linear infinite;
  }

  .spinner-ring:nth-child(1) {
    @apply border-t-blue-500 border-r-blue-400;
    animation-delay: 0s;
  }

  .spinner-ring:nth-child(2) {
    @apply border-t-green-500 border-r-green-400;
    animation-delay: 0.2s;
  }

  .spinner-ring:nth-child(3) {
    @apply border-t-purple-500 border-r-purple-400;
    animation-delay: 0.4s;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .loading-dots {
    @apply flex gap-2;
  }

  .loading-dots span {
    @apply w-3 h-3 bg-blue-500 rounded-full;
    animation: bounce 1.2s ease-in-out infinite both;
  }

  .loading-dots span:nth-child(1) {
    animation-delay: -0.32s;
  }

  .loading-dots span:nth-child(2) {
    animation-delay: -0.16s;
  }

  .loading-dots span:nth-child(3) {
    animation-delay: 0s;
  }

  @keyframes bounce {
    0%,
    80%,
    100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }

  .progress-container {
    @apply w-full max-w-xs mx-auto;
  }

  .progress-bar {
    @apply w-full h-3 bg-gray-200 rounded-full overflow-hidden;
  }

  .progress-fill {
    @apply h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out;
  }

  .progress-text {
    @apply text-center text-sm text-gray-600 mt-2;
  }

  /* Dark mode for processing */
  .progress-bar {
    @apply dark:bg-gray-700;
  }

  /* TanStack Query Progress Styles */
  .tanstack-progress {
    @apply space-y-3;
  }

  .query-status-item {
    @apply flex items-center gap-3 p-3 rounded-lg border transition-all duration-300;
    @apply bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700;
  }

  .query-status-item.active {
    @apply bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700;
  }

  .query-status-item.pending {
    @apply bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700;
  }

  .query-status-item.error {
    @apply bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700;
  }

  .status-indicator {
    @apply flex-shrink-0 w-6 h-6 flex items-center justify-center;
  }

  .status-text {
    @apply flex-1 flex flex-col gap-1;
  }

  .status-label {
    @apply text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide;
  }

  .status-value {
    @apply text-sm font-semibold text-gray-900 dark:text-gray-100;
  }

  .query-status-item.active .status-value {
    @apply text-green-700 dark:text-green-300;
  }

  .query-status-item.pending .status-value {
    @apply text-blue-700 dark:text-blue-300;
  }

  .query-status-item.error .status-value {
    @apply text-red-700 dark:text-red-300;
  }

  .retry-info {
    @apply border border-yellow-200 dark:border-yellow-700;
  }

  .progress-text {
    @apply dark:text-gray-300;
  }
</style>
