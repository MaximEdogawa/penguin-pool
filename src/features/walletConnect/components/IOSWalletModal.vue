<template>
  <div v-if="isVisible" class="ios-modal-overlay" @click="handleOverlayClick">
    <div class="ios-modal" @click.stop>
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
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
  import { nextTick, ref, watch } from 'vue'

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

      // Generate QR code as data URL
      console.log('🔍 Generating QR code data URL...')
      const qrCodeDataUrl = await QRCode.toDataURL(props.uri, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      })
      console.log('✅ QR code data URL generated:', qrCodeDataUrl.substring(0, 50) + '...')

      // Create QR code image
      const qrCodeImg = document.createElement('img')
      qrCodeImg.src = qrCodeDataUrl
      qrCodeImg.alt = 'WalletConnect QR Code'
      qrCodeImg.className = 'qr-image'
      qrCodeImg.style.width = '200px'
      qrCodeImg.style.height = '200px'
      qrCodeImg.style.borderRadius = '12px'
      qrCodeImg.style.border = '1px solid #e5e7eb'
      qrCodeImg.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'

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
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .ios-modal {
    background: white;
    border-radius: 20px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    max-width: 400px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .ios-modal-header {
    padding: 24px 24px 16px;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .app-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    overflow: hidden;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .app-icon .icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .header-text h3 {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  .header-text p {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
  }

  .close-button {
    background: none;
    border: none;
    padding: 8px;
    border-radius: 8px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-button:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .ios-modal-content {
    padding: 24px;
    flex: 1;
    overflow-y: auto;
  }

  .qr-section {
    margin-bottom: 24px;
  }

  .qr-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
    background: #f9fafb;
    border-radius: 12px;
    padding: 20px;
  }

  .qr-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(249, 250, 251, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #6b7280;
    border-radius: 12px;
  }

  .qr-error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(249, 250, 251, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #6b7280;
    border-radius: 12px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
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
    color: #ef4444;
  }

  .retry-button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
  }

  .retry-button:hover {
    background: #2563eb;
  }

  .qr-code {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .qr-image {
    max-width: 100%;
    height: auto;
  }

  .uri-section {
    margin-bottom: 24px;
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
    font-weight: 600;
    color: #111827;
  }

  .copy-status {
    font-size: 12px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .copy-status.copied {
    background: #dcfce7;
    color: #166534;
  }

  .copy-status.error {
    background: #fef2f2;
    color: #dc2626;
  }

  .uri-input-container {
    position: relative;
  }

  .uri-textarea {
    width: 100%;
    min-height: 80px;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-family:
      'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
    color: #374151;
    background: #f9fafb;
    resize: vertical;
    transition: border-color 0.2s;
  }

  .uri-textarea:focus {
    outline: none;
    border-color: #3b82f6;
    background: white;
  }

  .copy-button {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #3b82f6;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }

  .copy-button:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .copy-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }

  .instructions-section h4 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .steps {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .step {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .step-number {
    width: 24px;
    height: 24px;
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .step-content p {
    margin: 0;
    font-size: 14px;
    color: #374151;
    line-height: 1.5;
  }

  .ios-modal-footer {
    padding: 16px 24px 24px;
    border-top: 1px solid #f3f4f6;
  }

  .cancel-button {
    width: 100%;
    background: #f3f4f6;
    color: #374151;
    border: none;
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .cancel-button:hover {
    background: #e5e7eb;
  }

  /* Mobile optimizations */
  @media (max-width: 480px) {
    .ios-modal-overlay {
      padding: 16px;
    }

    .ios-modal {
      border-radius: 16px;
    }

    .ios-modal-header,
    .ios-modal-content,
    .ios-modal-footer {
      padding: 20px;
    }

    .qr-container {
      min-height: 180px;
      padding: 16px;
    }

    .uri-textarea {
      font-size: 11px;
    }
  }
</style>
