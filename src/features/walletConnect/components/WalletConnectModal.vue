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
                  <button @click="copyUri" class="copy-button" :class="{ copied: isCopied }">
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
            <button @click="retryConnection" class="retry-button">
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
                    ? formatBalance(walletInfo.balance.confirmed_wallet_balance)
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
  import QRCode from 'qrcode'
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { sageWalletConnectService } from '../services/SageWalletConnectService'
  import { useWalletConnectStore } from '../stores/walletConnectStore'
  import type { SageWalletInfo } from '../types/walletConnect.types'

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
    (e: 'connected', walletInfo: SageWalletInfo): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  const walletStore = useWalletConnectStore()

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

  // Available wallet options
  const availableWallets = ref<WalletOption[]>([
    {
      id: 'sage',
      name: 'Sage Wallet',
      description: 'Connect using Sage wallet for Chia Network',
      iconClass: 'pi pi-wallet',
      available: true,
      type: 'sage',
    },
    {
      id: 'other',
      name: 'Other Wallets',
      description: 'Connect using other compatible wallets',
      iconClass: 'pi pi-link',
      available: false,
      type: 'other',
    },
  ])

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

  const selectWallet = async (wallet: WalletOption) => {
    if (!wallet.available) return

    selectedWallet.value = wallet
    currentStep.value = 'connecting'
    isConnecting.value = true
    error.value = null

    try {
      console.log(`Starting connection to ${wallet.name}...`)
      const connection = await walletStore.startConnection()

      if (connection) {
        console.log('Connection URI generated:', connection.uri.substring(0, 50) + '...')
        connectionUri.value = connection.uri
        currentStep.value = 'qr-code'

        await generateQRCode(connection.uri)
        const session = await connection.approval()

        if (session) {
          console.log('Wallet connection approved:', session)

          // Show processing state
          currentStep.value = 'processing'
          processingProgress.value = 20
          processingMessage.value = 'Verifying connection...'

          // Wait a moment for the wallet store to update
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Try to fetch wallet info from the service
          try {
            processingProgress.value = 40
            processingMessage.value = 'Fetching wallet information...'

            const fetchedWalletInfo = await sageWalletConnectService.getWalletInfo()
            if (fetchedWalletInfo) {
              console.log('Fetched wallet info:', fetchedWalletInfo)

              processingProgress.value = 60
              processingMessage.value = 'Setting up account...'

              // Update the store with the fetched wallet info
              walletStore.walletInfo = fetchedWalletInfo

              processingProgress.value = 80
              processingMessage.value = 'Finalizing connection...'

              // Wait a moment to show the progress
              await new Promise(resolve => setTimeout(resolve, 500))

              processingProgress.value = 100
              processingMessage.value = 'Connection complete!'

              // Wait a moment then show success
              await new Promise(resolve => setTimeout(resolve, 500))

              currentStep.value = 'success'
              emit('connected', fetchedWalletInfo)
            } else {
              throw new Error('Failed to fetch wallet info from service')
            }
          } catch (fetchError) {
            console.error('Failed to fetch wallet info:', fetchError)
            error.value = 'Connected but failed to fetch wallet information'
            currentStep.value = 'error'
            console.log(
              'Fetch error state set - currentStep:',
              currentStep.value,
              'error:',
              error.value
            )
          }
        } else {
          error.value = 'Wallet connection was not approved'
          currentStep.value = 'error'
          console.log(
            'Approval error state set - currentStep:',
            currentStep.value,
            'error:',
            error.value
          )
        }
      } else {
        error.value = 'Failed to start connection - no connection URI generated'
        currentStep.value = 'error'
        console.log(
          'Connection URI error state set - currentStep:',
          currentStep.value,
          'error:',
          error.value
        )
      }
    } catch (err) {
      console.error('Wallet connection error:', err)
      error.value = err instanceof Error ? err.message : 'Connection failed'
      currentStep.value = 'error'
      console.log('Error state set - currentStep:', currentStep.value, 'error:', error.value)
    } finally {
      isConnecting.value = false
    }
  }

  const retryConnection = () => {
    // Reset to QR code step to show wallet connection dialog again
    currentStep.value = 'qr-code'
    error.value = null
  }

  const copyUri = async () => {
    if (connectionUri.value) {
      try {
        await navigator.clipboard.writeText(connectionUri.value)
        isCopied.value = true
        setTimeout(() => {
          isCopied.value = false
        }, 2000) // Reset after 2 seconds
      } catch (err) {
        console.error('Failed to copy URI:', err)
      }
    }
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

  // Watch for modal open state
  watch(
    () => props.isOpen,
    async isOpen => {
      if (isOpen) {
        resetModal()
        // Automatically start connection process
        await selectWallet(availableWallets.value[0]) // Start with Sage wallet
      }
    }
  )

  // Handle escape key
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.isOpen) {
      closeModal()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
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

  .progress-text {
    @apply dark:text-gray-300;
  }
</style>
