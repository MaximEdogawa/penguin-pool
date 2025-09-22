<template>
  <div v-if="isOpen" class="ios-wallet-modal-overlay" @click="handleOverlayClick">
    <div class="ios-wallet-modal" @click.stop>
      <div class="modal-header">
        <h3>Connect to Wallet</h3>
        <button @click="closeModal" class="close-button">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <div class="modal-content">
        <!-- QR Code Section -->
        <div v-if="uri" class="qr-section">
          <div class="qr-container">
            <div ref="qrCodeElement" class="qr-code"></div>
          </div>
          <p class="qr-instructions">Scan this QR code with your Chia wallet app</p>
        </div>

        <!-- URI Section -->
        <div v-if="uri" class="uri-section">
          <div class="uri-container">
            <input ref="uriInput" :value="uri" readonly class="uri-input" @focus="selectAll" />
            <button @click="copyURI" class="copy-button" :disabled="isCopying">
              <i v-if="!isCopying" class="pi pi-copy"></i>
              <i v-else class="pi pi-spin pi-spinner"></i>
              {{ isCopying ? 'Copying...' : 'Copy' }}
            </button>
          </div>
          <p class="uri-instructions">Or copy the connection string above</p>
        </div>

        <!-- Deep Link Section -->
        <div v-if="deepLink" class="deeplink-section">
          <button @click="openDeepLink" class="deeplink-button">
            <i class="pi pi-external-link"></i>
            Open in Chia Wallet
          </button>
        </div>

        <!-- iOS Instructions -->
        <div class="ios-instructions">
          <h4>iOS Instructions:</h4>
          <ol>
            <li>Make sure your Chia wallet app is installed and updated</li>
            <li>Open your Chia wallet app before connecting</li>
            <li>Scan the QR code or tap "Open in Chia Wallet"</li>
            <li>Approve the connection in your wallet app</li>
            <li>Wait for the connection to complete</li>
          </ol>
        </div>

        <!-- Status Messages -->
        <div v-if="error" class="error-message">
          <i class="pi pi-exclamation-triangle"></i>
          {{ error }}
        </div>

        <div v-if="copySuccess" class="success-message">
          <i class="pi pi-check-circle"></i>
          Connection string copied to clipboard!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, nextTick } from 'vue'
  import QRCode from 'qrcode'

  interface Props {
    isOpen: boolean
    uri?: string
  }

  interface Emits {
    (e: 'close'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const qrCodeElement = ref<HTMLDivElement>()
  const uriInput = ref<HTMLInputElement>()
  const isCopying = ref(false)
  const copySuccess = ref(false)
  const error = ref<string | null>(null)
  const deepLink = ref<string | null>(null)

  // Generate QR code when URI changes
  const generateQRCode = async () => {
    if (!props.uri || !qrCodeElement.value) return

    try {
      const qrCodeDataURL = await QRCode.toDataURL(props.uri, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      qrCodeElement.value.innerHTML = `<img src="${qrCodeDataURL}" alt="QR Code" />`
    } catch (err) {
      console.error('Failed to generate QR code:', err)
      error.value = 'Failed to generate QR code'
    }
  }

  // Generate deep link
  const generateDeepLink = () => {
    if (!props.uri) return null

    return `chia://walletconnect?uri=${encodeURIComponent(props.uri)}`
  }

  // Copy URI to clipboard with iOS-friendly method
  const copyURI = async () => {
    if (!props.uri) return

    isCopying.value = true
    error.value = null
    copySuccess.value = false

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(props.uri)
        copySuccess.value = true
      } else {
        // Fallback for iOS Safari
        const textarea = document.createElement('textarea')
        textarea.value = props.uri
        textarea.style.position = 'fixed'
        textarea.style.left = '-999999px'
        textarea.style.top = '-999999px'
        document.body.appendChild(textarea)

        textarea.focus()
        textarea.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(textarea)

        if (successful) {
          copySuccess.value = true
        } else {
          throw new Error('Copy command failed')
        }
      }
    } catch (err) {
      console.error('Copy failed:', err)
      error.value = 'Failed to copy to clipboard. Please select and copy manually.'
    } finally {
      isCopying.value = false
      setTimeout(() => {
        copySuccess.value = false
      }, 3000)
    }
  }

  // Select all text in input
  const selectAll = () => {
    nextTick(() => {
      uriInput.value?.select()
    })
  }

  // Open deep link
  const openDeepLink = () => {
    if (deepLink.value) {
      window.location.href = deepLink.value
    }
  }

  // Close modal
  const closeModal = () => {
    emit('close')
  }

  // Handle overlay click
  const handleOverlayClick = () => {
    closeModal()
  }

  // Watch for URI changes
  onMounted(async () => {
    if (props.uri) {
      deepLink.value = generateDeepLink()
      await generateQRCode()
    }
  })

  // Cleanup
  onUnmounted(() => {
    // Cleanup if needed
  })
</script>

<style scoped>
  .ios-wallet-modal-overlay {
    @apply fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm;
  }

  .ios-wallet-modal {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto;
  }

  .modal-header {
    @apply flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700;
  }

  .modal-header h3 {
    @apply text-lg font-semibold text-gray-900 dark:text-white;
  }

  .close-button {
    @apply p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors;
  }

  .modal-content {
    @apply p-4 space-y-4;
  }

  .qr-section {
    @apply text-center;
  }

  .qr-container {
    @apply bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-700 inline-block;
  }

  .qr-code {
    @apply w-64 h-64 mx-auto;
  }

  .qr-instructions {
    @apply text-sm text-gray-600 dark:text-gray-400 mt-2;
  }

  .uri-section {
    @apply space-y-2;
  }

  .uri-container {
    @apply flex gap-2;
  }

  .uri-input {
    @apply flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm font-mono text-gray-900 dark:text-white;
  }

  .copy-button {
    @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2;
  }

  .uri-instructions {
    @apply text-xs text-gray-500 dark:text-gray-400;
  }

  .deeplink-section {
    @apply text-center;
  }

  .deeplink-button {
    @apply w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2;
  }

  .ios-instructions {
    @apply bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg;
  }

  .ios-instructions h4 {
    @apply text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2;
  }

  .ios-instructions ol {
    @apply text-xs text-blue-800 dark:text-blue-200 space-y-1;
  }

  .ios-instructions li {
    @apply list-decimal list-inside;
  }

  .error-message {
    @apply flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm;
  }

  .success-message {
    @apply flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm;
  }
</style>
