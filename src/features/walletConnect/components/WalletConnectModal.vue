<template>
  <div v-if="isOpen" class="wallet-connect-modal-overlay" @click="handleOverlayClick">
    <div class="wallet-connect-modal" @click.stop>
      <div class="modal-content">
        <!-- Wallet Selection Step -->
        <div v-if="currentStep === 'selection'" class="wallet-selection-step">
          <div class="wallet-grid">
            <button
              v-for="wallet in availableWallets"
              :key="wallet.id"
              @click="selectWallet(wallet)"
              class="wallet-option"
              :class="{ disabled: !wallet.available }"
              :disabled="!wallet.available"
            >
              <div class="wallet-icon">
                <i :class="wallet.iconClass"></i>
              </div>
              <div class="wallet-info">
                <h3 class="wallet-name">{{ wallet.name }}</h3>
                <p class="wallet-description">{{ wallet.description }}</p>
                <div v-if="!wallet.available" class="wallet-unavailable">
                  <i class="pi pi-exclamation-triangle"></i>
                  <span>Coming Soon</span>
                </div>
              </div>
              <div class="wallet-status">
                <i v-if="wallet.available" class="pi pi-arrow-right"></i>
                <i v-else class="pi pi-lock"></i>
              </div>
            </button>
          </div>
        </div>

        <!-- Connection Status -->
        <div v-else-if="currentStep === 'connecting'" class="connection-status">
          <div class="spinner"></div>
          <h3>Connecting to {{ selectedWallet?.name }}...</h3>
          <p>Please wait while we establish the connection</p>
        </div>

        <!-- QR Code Display -->
        <div v-else-if="currentStep === 'qr-code'" class="qr-section">
          <div class="qr-header">
            <div class="wallet-icon-large">
              <i :class="selectedWallet?.iconClass"></i>
            </div>
            <h3>Connect with {{ selectedWallet?.name }}</h3>
            <p>Scan the QR code with your mobile wallet</p>
          </div>

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

          <div class="connection-options">
            <div class="uri-section">
              <div class="uri-header">
                <i class="pi pi-link"></i>
                <span>Or copy connection link</span>
              </div>
              <div class="uri-input-container">
                <input
                  :value="connectionUri"
                  readonly
                  class="uri-input"
                  @click="selectUri"
                  placeholder="Connection URI"
                />
                <button @click="copyUri" class="copy-button">
                  <i class="pi pi-copy"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="wallet-download-section">
            <a href="https://sagewallet.net/" target="_blank" class="download-link">
              <i class="pi pi-download"></i>
              <span>Don't have {{ selectedWallet?.name }}? Download it here</span>
            </a>
          </div>
        </div>

        <!-- Error Display -->
        <div v-else-if="currentStep === 'error'" class="error-section">
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
            <button @click="goBackToSelection" class="back-button">
              <i class="pi pi-arrow-left"></i>
              Back to Selection
            </button>
          </div>
        </div>

        <!-- Success Display -->
        <div v-else-if="currentStep === 'success'" class="success-section">
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
          <div class="success-actions">
            <button @click="proceedToDashboard" class="proceed-button">
              <i class="pi pi-arrow-right"></i>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button v-if="currentStep === 'selection'" @click="closeModal" class="cancel-button">
          Cancel
        </button>
        <button
          v-else-if="currentStep === 'qr-code'"
          @click="goBackToSelection"
          class="back-button"
        >
          <i class="pi pi-arrow-left"></i>
          Back
        </button>
        <button v-else-if="currentStep === 'success'" @click="closeModal" class="done-button">
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import QRCode from 'qrcode'
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
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
  const router = useRouter()
  const walletStore = useWalletConnectStore()

  // State
  const currentStep = ref<'selection' | 'connecting' | 'qr-code' | 'error' | 'success'>('qr-code')
  const selectedWallet = ref<WalletOption | null>(null)
  const connectionUri = ref<string | null>(null)
  const qrCodeDataUrl = ref<string | null>(null)
  const isConnecting = ref(false)
  const error = ref<string | null>(null)

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
      id: 'chia',
      name: 'Chia Wallet',
      description: 'Connect using official Chia wallet',
      iconClass: 'pi pi-wallet',
      available: false,
      type: 'chia',
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

  const resetModal = () => {
    currentStep.value = 'selection'
    selectedWallet.value = null
    connectionUri.value = null
    qrCodeDataUrl.value = null
    isConnecting.value = false
    error.value = null
  }

  const handleOverlayClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      closeModal()
    }
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

        // Generate QR code
        await generateQRCode(connection.uri)

        // Wait for approval
        console.log('Waiting for wallet approval...')
        const session = await connection.approval()

        if (session) {
          console.log('Wallet connection approved:', session)
          // Connection successful
          await walletStore.refreshWalletInfo()
          currentStep.value = 'success'
          emit('connected', walletInfo.value!)
        } else {
          error.value = 'Wallet connection was not approved'
          currentStep.value = 'error'
        }
      } else {
        error.value = 'Failed to start connection - no connection URI generated'
        currentStep.value = 'error'
      }
    } catch (err) {
      console.error('Wallet connection error:', err)
      error.value = err instanceof Error ? err.message : 'Connection failed'
      currentStep.value = 'error'
    } finally {
      isConnecting.value = false
    }
  }

  const goBackToSelection = () => {
    currentStep.value = 'selection'
    selectedWallet.value = null
    connectionUri.value = null
    qrCodeDataUrl.value = null
    error.value = null
  }

  const retryConnection = () => {
    if (selectedWallet.value) {
      selectWallet(selectedWallet.value)
    }
  }

  const proceedToDashboard = () => {
    closeModal()
    router.push('/dashboard')
  }

  const copyUri = async () => {
    if (connectionUri.value) {
      try {
        await navigator.clipboard.writeText(connectionUri.value)
        // Could show a toast notification here
        console.log('URI copied to clipboard')
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
        width: 200,
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
  .wallet-connect-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .wallet-connect-modal {
    background: white;
    border-radius: 12px;
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    padding: 2rem 2rem 1rem 2rem;
    text-align: center;
    position: relative;
  }

  .modal-header h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
  }

  .modal-subtitle {
    margin: 0 0 1rem 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .close-button {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
    color: #6b7280;
    transition: all 0.2s;
  }

  .close-button:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .modal-content {
    padding: 0 2rem 2rem 2rem;
    flex: 1;
    overflow-y: auto;
  }

  /* Wallet Selection Step */
  .wallet-selection-step {
    padding: 1rem 0;
  }

  .wallet-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .wallet-option {
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }

  .wallet-option:hover:not(.disabled) {
    border-color: #3b82f6;
    background: #f8fafc;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  .wallet-option.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .wallet-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    flex-shrink: 0;
  }

  .wallet-icon i {
    color: #6b7280;
    font-size: 1.5rem;
  }

  .wallet-info {
    flex: 1;
  }

  .wallet-name {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
  }

  .wallet-description {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .wallet-unavailable {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #f59e0b;
    font-weight: 500;
  }

  .wallet-status {
    color: #6b7280;
    font-size: 1.25rem;
  }

  .wallet-option:hover:not(.disabled) .wallet-status {
    color: #3b82f6;
  }

  .connection-status {
    text-align: center;
    padding: 2rem 0;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .qr-section {
    text-align: center;
    padding: 2rem;
  }

  .qr-header {
    margin-bottom: 2rem;
  }

  .wallet-icon-large {
    width: 72px;
    height: 72px;
    border-radius: 18px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
  }

  .wallet-icon-large i {
    color: white;
    font-size: 2.25rem;
  }

  .qr-header h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
  }

  .qr-header p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .qr-container {
    margin-bottom: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .qr-wrapper {
    position: relative;
    display: inline-block;
  }

  .qr-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 280px;
    height: 280px;
    border: 2px solid #e5e7eb;
    border-radius: 20px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    margin: 0 auto;
    position: relative;
    overflow: hidden;
  }

  .qr-placeholder::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.1), transparent);
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%) translateY(-100%) rotate(45deg);
    }
    100% {
      transform: translateX(100%) translateY(100%) rotate(45deg);
    }
  }

  .qr-spinner-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1;
    position: relative;
  }

  .qr-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .qr-placeholder p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .qr-code {
    position: relative;
    display: inline-block;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  }

  .qr-code-border {
    padding: 24px;
    background: white;
    border-radius: 24px;
    border: 2px solid #e5e7eb;
  }

  .qr-code img {
    display: block;
    width: 260px;
    height: 260px;
    border-radius: 16px;
  }

  .qr-code-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    border-radius: 20px;
    overflow: hidden;
  }

  .scanning-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
    animation: scan 2s ease-in-out infinite;
  }

  .scan-line {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #3b82f6, transparent);
    animation: scanLine 2s ease-in-out infinite;
  }

  @keyframes scan {
    0%,
    100% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
  }

  @keyframes scanLine {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }

  .connection-options {
    margin-bottom: 1.5rem;
  }

  .uri-section {
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 1.5rem;
  }

  .uri-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    color: #374151;
    font-weight: 500;
    font-size: 0.875rem;
  }

  .uri-header i {
    color: #3b82f6;
    font-size: 1rem;
  }

  .uri-input-container {
    display: flex;
    gap: 0.75rem;
  }

  .uri-input {
    flex: 1;
    padding: 0.875rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
    font-size: 0.875rem;
    background: white;
    color: #374151;
    transition: all 0.2s;
  }

  .uri-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .copy-button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.875rem 1rem;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 60px;
  }

  .copy-button:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .copy-button i {
    font-size: 0.875rem;
  }

  .wallet-download-section {
    text-align: center;
  }

  .download-link {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.875rem;
    padding: 0.75rem 1.5rem;
    border: 1px solid #3b82f6;
    border-radius: 12px;
    transition: all 0.2s;
    background: rgba(59, 130, 246, 0.05);
  }

  .download-link:hover {
    background: #3b82f6;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .download-link i {
    font-size: 1rem;
  }

  .error-section {
    text-align: center;
    padding: 2rem 0;
  }

  .error-icon {
    color: #ef4444;
    margin-bottom: 1rem;
    font-size: 3rem;
  }

  .error-section h3 {
    margin: 0 0 0.5rem 0;
    color: #111827;
    font-size: 1.25rem;
  }

  .error-section p {
    margin: 0 0 2rem 0;
    color: #6b7280;
  }

  .error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .retry-button {
    background: #ef4444;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .retry-button:hover {
    background: #dc2626;
  }

  .back-button {
    background: #6b7280;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .back-button:hover {
    background: #4b5563;
  }

  .success-section {
    text-align: center;
    padding: 2rem 0;
  }

  .success-icon {
    color: #10b981;
    margin-bottom: 1rem;
    font-size: 3rem;
  }

  .success-section h3 {
    margin: 0 0 0.5rem 0;
    color: #111827;
    font-size: 1.25rem;
  }

  .success-section p {
    margin: 0 0 2rem 0;
    color: #6b7280;
  }

  .success-actions {
    margin-top: 2rem;
  }

  .proceed-button {
    background: #10b981;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 auto;
  }

  .proceed-button:hover {
    background: #059669;
  }

  .proceed-button i {
    font-size: 1rem;
  }

  .wallet-info {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    text-align: left;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .info-item:last-child {
    margin-bottom: 0;
  }

  .info-item .label {
    font-weight: 500;
    color: #374151;
  }

  .info-item .value {
    font-family: monospace;
    color: #6b7280;
    word-break: break-all;
  }

  .modal-footer {
    padding: 1.5rem 2rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .cancel-button,
  .done-button,
  .back-button {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .cancel-button {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .cancel-button:hover {
    background: #e5e7eb;
  }

  .done-button {
    background: #10b981;
    color: white;
    border: none;
  }

  .done-button:hover {
    background: #059669;
  }

  .back-button {
    background: #6b7280;
    color: white;
    border: none;
  }

  .back-button:hover {
    background: #4b5563;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .qr-section {
      padding: 1.5rem;
    }

    .qr-placeholder {
      width: 240px;
      height: 240px;
    }

    .qr-code img {
      width: 220px;
      height: 220px;
    }

    .qr-code-border {
      padding: 20px;
    }
  }

  @media (max-width: 640px) {
    .wallet-connect-modal {
      width: 95%;
      max-width: none;
      margin: 1rem;
    }

    .qr-section {
      padding: 1rem;
    }

    .wallet-icon-large {
      width: 64px;
      height: 64px;
    }

    .wallet-icon-large i {
      font-size: 2rem;
    }

    .qr-header h3 {
      font-size: 1.25rem;
    }

    .qr-placeholder {
      width: 200px;
      height: 200px;
    }

    .qr-code img {
      width: 180px;
      height: 180px;
    }

    .qr-code-border {
      padding: 16px;
    }

    .uri-section {
      padding: 1rem;
    }

    .uri-input-container {
      flex-direction: column;
      gap: 0.5rem;
    }

    .copy-button {
      width: 100%;
      justify-content: center;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      flex-direction: column;
      gap: 0.5rem;
    }

    .modal-footer button {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .qr-placeholder {
      width: 180px;
      height: 180px;
    }

    .qr-code img {
      width: 160px;
      height: 160px;
    }

    .qr-code-border {
      padding: 14px;
    }

    .wallet-icon-large {
      width: 56px;
      height: 56px;
    }

    .wallet-icon-large i {
      font-size: 1.75rem;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .wallet-connect-modal {
      background: #1f2937;
      color: #f9fafb;
    }

    .modal-header h2 {
      color: #f9fafb;
    }

    .modal-subtitle {
      color: #9ca3af;
    }

    .qr-header h3 {
      color: #f9fafb;
    }

    .qr-header p {
      color: #9ca3af;
    }

    .qr-code-border {
      background: #374151;
      border-color: #4b5563;
    }

    .uri-section {
      background: #374151;
      border-color: #4b5563;
    }

    .uri-header {
      color: #d1d5db;
    }

    .uri-input {
      background: #1f2937;
      border-color: #4b5563;
      color: #f9fafb;
    }

    .uri-input:focus {
      border-color: #3b82f6;
    }

    .download-link {
      color: #60a5fa;
      border-color: #60a5fa;
      background: rgba(96, 165, 250, 0.1);
    }

    .download-link:hover {
      background: #60a5fa;
      color: white;
    }
  }
</style>
