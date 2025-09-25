<template>
  <div
    v-if="isVisible"
    class="ios-modal-overlay"
    :class="{ 'dark-mode': isDarkMode }"
    @click="handleOverlayClick"
  >
    <div class="ios-modal" :class="{ 'dark-mode': isDarkMode }" @click.stop>
      <!-- Header -->
      <div class="ios-modal-header">
        <div class="header-content">
          <div class="app-icon">
            <img src="/icons/icon-192x192.png" alt="Penguin Pool" class="icon" />
          </div>
          <div class="header-text">
            <h3>Connect to Sage Wallet</h3>
            <p>Scan QR code or copy connection string</p>
          </div>
        </div>
        <button @click="closeModal" class="close-button" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="ios-modal-content">
        <!-- QR Code Section -->
        <div class="qr-section">
          <div class="qr-container">
            <div id="ios-qr-code" class="qr-code" ref="qrCodeRef">
              <!-- QR code will be inserted here -->
            </div>
            <div v-if="qrCodeLoading" class="qr-loading-overlay">
              <div class="spinner"></div>
              <p>Generating QR code...</p>
            </div>
            <div v-if="qrCodeError" class="qr-error-overlay">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="error-icon"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
              <p>Failed to generate QR code</p>
              <button @click="generateQRCode" class="retry-button">Retry</button>
            </div>
          </div>
        </div>

        <!-- URI Section -->
        <div class="uri-section">
          <div class="uri-header">
            <h4>Connection String</h4>
            <div
              class="copy-status"
              :class="{ copied: copyStatus === 'copied', error: copyStatus === 'error' }"
            >
              <span v-if="copyStatus === 'copied'">✓ Copied!</span>
              <span v-else-if="copyStatus === 'error'">✗ Failed</span>
            </div>
          </div>

          <div class="uri-input-container">
            <textarea
              ref="uriTextarea"
              :value="props.uri"
              readonly
              class="uri-textarea"
              placeholder="Connection string will appear here..."
              @focus="selectAll"
            ></textarea>
            <button
              @click="copyToClipboard"
              class="copy-button"
              :disabled="!props.uri || copyStatus === 'copied'"
            >
              <svg
                v-if="copyStatus !== 'copied'"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
                />
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              {{ copyStatus === 'copied' ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <!-- Instructions -->
        <div class="instructions-section">
          <h4>How to connect:</h4>
          <div class="steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <p>Copy the connection string above</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <p>Open Sage Wallet app on your device</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <p>Tap "Connect" or "Scan QR" in the app</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">4</div>
              <div class="step-content">
                <p>Paste the connection string and approve</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="ios-modal-footer">
        <button @click="closeModal" class="cancel-button">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'

  interface Props {
    isVisible: boolean
    uri: string
  }

  interface Emits {
    (e: 'close'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // Refs
  const qrCodeRef = ref<HTMLElement>()
  const uriTextarea = ref<HTMLTextAreaElement>()

  // State
  const qrCodeLoading = ref(false)
  const qrCodeError = ref(false)
  const copyStatus = ref<'idle' | 'copied' | 'error'>('idle')

  // Dark mode detection
  const isDarkMode = computed(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Watch for URI changes
  watch(
    () => props.uri,
    (newUri, oldUri) => {
      console.log('🔍 URI changed:', { newUri, oldUri, isVisible: props.isVisible })
      if (newUri && props.isVisible) {
        console.log('🔍 URI changed and modal visible, generating QR code...')
        nextTick(() => {
          generateQRCode()
        })
      }
    },
    { immediate: true }
  )

  // Watch for visibility changes
  watch(
    () => props.isVisible,
    (visible, oldVisible) => {
      console.log('🔍 Visibility changed:', { visible, oldVisible, uri: props.uri })
      if (visible && props.uri) {
        console.log('🔍 Modal became visible with URI, generating QR code...')
        nextTick(() => {
          generateQRCode()
        })
      }
    }
  )

  // Methods
  const ensureQRCodeRef = (): boolean => {
    if (!qrCodeRef.value) {
      // Try to get the element by ID as fallback
      const fallbackElement = document.getElementById('ios-qr-code')
      if (fallbackElement) {
        console.log('🔍 Using fallback element for QR code')
        qrCodeRef.value = fallbackElement as HTMLElement
        return true
      }
      console.warn('⚠️ QR code ref not available and no fallback found')
      return false
    }
    return true
  }

  const generateQRCode = async (): Promise<void> => {
    console.log('🔍 generateQRCode called with:', {
      uri: props.uri,
      qrCodeRef: qrCodeRef.value,
      isVisible: props.isVisible,
    })

    if (!props.uri) {
      console.warn('⚠️ No URI provided for QR code generation')
      return
    }

    if (!ensureQRCodeRef()) {
      console.warn('⚠️ QR code ref not available, retrying in 100ms')
      console.warn('⚠️ Current ref state:', {
        qrCodeRef: qrCodeRef.value,
        isVisible: props.isVisible,
      })
      setTimeout(() => generateQRCode(), 100)
      return
    }

    qrCodeLoading.value = true
    qrCodeError.value = false

    try {
      console.log('🔍 Starting QR code generation for URI:', props.uri)

      // Import QRCode library dynamically
      console.log('🔍 Importing QRCode library...')
      const QRCodeModule = await import('qrcode')
      const QRCode = QRCodeModule.default
      console.log('✅ QRCode library imported successfully')

      // Generate QR code as data URL with dark mode support
      console.log('🔍 Generating QR code data URL...')
      const qrCodeDataUrl = await QRCode.toDataURL(props.uri, {
        width: 180,
        margin: 2,
        color: {
          dark: isDarkMode.value ? '#FFFFFF' : '#000000',
          light: isDarkMode.value ? '#1C1C1E' : '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      })
      console.log('✅ QR code data URL generated:', qrCodeDataUrl.substring(0, 50) + '...')

      // Create QR code image
      const qrCodeImg = document.createElement('img')
      qrCodeImg.src = qrCodeDataUrl
      qrCodeImg.alt = 'WalletConnect QR Code'
      qrCodeImg.className = 'qr-image'
      qrCodeImg.style.width = '180px'
      qrCodeImg.style.height = '180px'
      qrCodeImg.style.borderRadius = '16px'
      qrCodeImg.style.border = isDarkMode.value
        ? '1px solid rgba(255, 255, 255, 0.1)'
        : '1px solid rgba(0, 0, 0, 0.1)'
      qrCodeImg.style.boxShadow = isDarkMode.value
        ? '0 8px 24px rgba(0, 0, 0, 0.3)'
        : '0 8px 24px rgba(0, 0, 0, 0.1)'

      // Add error handling for image load
      qrCodeImg.onerror = () => {
        console.error('❌ QR code image failed to load')
        qrCodeError.value = true
        qrCodeLoading.value = false
      }

      qrCodeImg.onload = () => {
        console.log('✅ QR code image loaded successfully')
      }

      // Clear previous content and add QR code
      if (!ensureQRCodeRef()) {
        console.error('❌ QR code ref became null during generation')
        qrCodeError.value = true
        qrCodeLoading.value = false
        return
      }

      // TypeScript assertion since we've already checked above
      const qrElement = qrCodeRef.value!
      qrElement.innerHTML = ''
      qrElement.appendChild(qrCodeImg)

      qrCodeLoading.value = false
      console.log('✅ QR code generated and added to DOM successfully')
    } catch (error) {
      console.error('❌ Failed to generate QR code:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        uri: props.uri,
      })
      qrCodeLoading.value = false
      qrCodeError.value = true
    }
  }

  const copyToClipboard = async (): Promise<void> => {
    if (!props.uri) return

    copyStatus.value = 'idle'

    try {
      // Method 1: Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(props.uri)
        copyStatus.value = 'copied'
        console.log('✅ Text copied to clipboard (modern API)')
        return
      }

      // Method 2: Fallback for older browsers/iOS
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
        copyStatus.value = 'copied'
        console.log('✅ Text copied to clipboard (fallback method)')
      } else {
        throw new Error('execCommand failed')
      }
    } catch (error) {
      console.error('❌ Copy failed:', error)
      copyStatus.value = 'error'
    }

    // Reset status after 3 seconds
    setTimeout(() => {
      copyStatus.value = 'idle'
    }, 3000)
  }

  const selectAll = (): void => {
    if (uriTextarea.value) {
      uriTextarea.value.select()
    }
  }

  const closeModal = (): void => {
    emit('close')
  }

  const handleOverlayClick = (event: MouseEvent): void => {
    if (event.target === event.currentTarget) {
      closeModal()
    }
  }

  // Reset copy status when modal opens
  watch(
    () => props.isVisible,
    visible => {
      if (visible) {
        copyStatus.value = 'idle'
      }
    }
  )
</script>

<style scoped>
  .ios-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
    animation: fadeIn 0.3s ease-out;
  }

  .ios-modal-overlay.dark-mode {
    background: rgba(0, 0, 0, 0.6);
  }

  .ios-modal {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow:
      0 20px 40px -12px rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    max-width: 340px;
    width: 100%;
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .ios-modal.dark-mode {
    background: rgba(28, 28, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 20px 40px -12px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .ios-modal-header {
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%);
  }

  .ios-modal.dark-mode .ios-modal-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: linear-gradient(135deg, rgba(28, 28, 30, 0.8) 0%, rgba(28, 28, 30, 0.4) 100%);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .app-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    overflow: hidden;
    background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      0 6px 12px rgba(0, 122, 255, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .app-icon .icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 12px;
  }

  .header-text h3 {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 700;
    color: #1d1d1f;
    letter-spacing: -0.02em;
  }

  .ios-modal.dark-mode .header-text h3 {
    color: #ffffff;
  }

  .header-text p {
    margin: 0;
    font-size: 14px;
    color: #86868b;
    font-weight: 400;
    line-height: 1.3;
  }

  .ios-modal.dark-mode .header-text p {
    color: #8e8e93;
  }

  .close-button {
    background: rgba(0, 0, 0, 0.05);
    border: none;
    padding: 8px;
    border-radius: 10px;
    color: #86868b;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .ios-modal.dark-mode .close-button {
    background: rgba(255, 255, 255, 0.1);
    color: #8e8e93;
  }

  .close-button:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #1d1d1f;
    transform: scale(1.05);
  }

  .ios-modal.dark-mode .close-button:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
  }

  .close-button:active {
    transform: scale(0.95);
  }

  .ios-modal-content {
    padding: 20px;
    flex: 1;
    overflow-y: auto;
  }

  .qr-section {
    margin-bottom: 20px;
  }

  .qr-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 180px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .ios-modal.dark-mode .qr-container {
    background: linear-gradient(135deg, rgba(28, 28, 30, 0.8) 0%, rgba(44, 44, 46, 0.6) 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .qr-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #86868b;
    border-radius: 16px;
  }

  .ios-modal.dark-mode .qr-loading-overlay {
    background: rgba(28, 28, 30, 0.95);
    color: #8e8e93;
  }

  .qr-error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #86868b;
    border-radius: 16px;
  }

  .ios-modal.dark-mode .qr-error-overlay {
    background: rgba(28, 28, 30, 0.95);
    color: #8e8e93;
  }

  .spinner {
    width: 28px;
    height: 28px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-top: 2px solid #007aff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .ios-modal.dark-mode .spinner {
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-top: 2px solid #007aff;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .error-icon {
    color: #ff3b30;
    opacity: 0.8;
  }

  .retry-button {
    background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  }

  .retry-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 122, 255, 0.4);
  }

  .retry-button:active {
    transform: translateY(0);
  }

  .qr-code {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .qr-image {
    max-width: 100%;
    height: auto;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .uri-section {
    margin-bottom: 20px;
  }

  .uri-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .uri-header h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #1d1d1f;
    letter-spacing: -0.02em;
  }

  .ios-modal.dark-mode .uri-header h4 {
    color: #ffffff;
  }

  .copy-status {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 8px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .copy-status.copied {
    background: rgba(52, 199, 89, 0.15);
    color: #34c759;
    border: 1px solid rgba(52, 199, 89, 0.2);
  }

  .ios-modal.dark-mode .copy-status.copied {
    background: rgba(52, 199, 89, 0.2);
    color: #30d158;
  }

  .copy-status.error {
    background: rgba(255, 59, 48, 0.15);
    color: #ff3b30;
    border: 1px solid rgba(255, 59, 48, 0.2);
  }

  .ios-modal.dark-mode .copy-status.error {
    background: rgba(255, 59, 48, 0.2);
    color: #ff453a;
  }

  .uri-input-container {
    position: relative;
  }

  .uri-textarea {
    width: 100%;
    min-height: 70px;
    padding: 12px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    font-family:
      'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
    color: #1d1d1f;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    resize: vertical;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .ios-modal.dark-mode .uri-textarea {
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
    background: rgba(28, 28, 30, 0.8);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .uri-textarea:focus {
    outline: none;
    border-color: #007aff;
    background: rgba(255, 255, 255, 0.95);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 0 0 3px rgba(0, 122, 255, 0.1);
  }

  .ios-modal.dark-mode .uri-textarea:focus {
    background: rgba(28, 28, 30, 0.95);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      0 0 0 3px rgba(0, 122, 255, 0.2);
  }

  .copy-button {
    position: absolute;
    top: 8px;
    right: 8px;
    background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .copy-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 122, 255, 0.4);
  }

  .copy-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .copy-button:disabled {
    background: rgba(0, 0, 0, 0.1);
    color: rgba(0, 0, 0, 0.3);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .ios-modal.dark-mode .copy-button:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.3);
  }

  .instructions-section h4 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 700;
    color: #1d1d1f;
    letter-spacing: -0.02em;
  }

  .ios-modal.dark-mode .instructions-section h4 {
    color: #ffffff;
  }

  .steps {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .step {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .step-number {
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  }

  .step-content p {
    margin: 0;
    font-size: 14px;
    color: #1d1d1f;
    line-height: 1.4;
    font-weight: 400;
  }

  .ios-modal.dark-mode .step-content p {
    color: #ffffff;
  }

  .ios-modal-footer {
    padding: 16px 20px 20px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%);
  }

  .ios-modal.dark-mode .ios-modal-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: linear-gradient(135deg, rgba(28, 28, 30, 0.8) 0%, rgba(28, 28, 30, 0.4) 100%);
  }

  .cancel-button {
    width: 100%;
    background: rgba(0, 0, 0, 0.05);
    color: #1d1d1f;
    border: none;
    padding: 14px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .ios-modal.dark-mode .cancel-button {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .cancel-button:hover {
    background: rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  .ios-modal.dark-mode .cancel-button:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .cancel-button:active {
    transform: translateY(0);
  }

  /* Mobile optimizations */
  @media (max-width: 480px) {
    .ios-modal-overlay {
      padding: 12px;
    }

    .ios-modal {
      border-radius: 16px;
      max-height: 90vh;
      max-width: 320px;
    }

    .ios-modal-header {
      padding: 16px 16px 12px;
    }

    .ios-modal-content {
      padding: 16px;
    }

    .ios-modal-footer {
      padding: 12px 16px 16px;
    }

    .app-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
    }

    .header-text h3 {
      font-size: 16px;
    }

    .header-text p {
      font-size: 13px;
    }

    .qr-container {
      min-height: 160px;
      padding: 16px;
    }

    .uri-textarea {
      font-size: 11px;
      min-height: 60px;
      padding: 10px;
    }

    .copy-button {
      padding: 6px 10px;
      font-size: 11px;
    }

    .instructions-section h4 {
      font-size: 15px;
    }

    .step-content p {
      font-size: 13px;
    }

    .step-number {
      width: 20px;
      height: 20px;
      font-size: 11px;
    }

    .cancel-button {
      padding: 12px;
      font-size: 15px;
    }
  }

  /* iOS-specific optimizations */
  @supports (-webkit-touch-callout: none) {
    .ios-modal-overlay {
      -webkit-overflow-scrolling: touch;
    }

    .uri-textarea {
      -webkit-appearance: none;
      -webkit-tap-highlight-color: transparent;
    }

    .copy-button,
    .cancel-button,
    .retry-button {
      -webkit-tap-highlight-color: transparent;
    }
  }
</style>
