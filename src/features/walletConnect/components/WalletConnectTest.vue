<template>
  <div class="wallet-connect-test">
    <h2>Wallet Connect Test</h2>

    <div class="test-section">
      <h3>QR Code Test</h3>
      <button @click="testQRCode" :disabled="isGenerating">
        {{ isGenerating ? 'Generating...' : 'Generate Test QR Code' }}
      </button>

      <div v-if="qrCodeData" class="qr-test">
        <div class="qr-container">
          <div class="qr-code" ref="qrCodeRef"></div>
        </div>
        <p>Test QR Code: {{ qrCodeData.substring(0, 50) }}...</p>
      </div>
    </div>

    <div class="test-section">
      <h3>Connection Test</h3>
      <button @click="testConnection" :disabled="isConnecting">
        {{ isConnecting ? 'Connecting...' : 'Test Wallet Connection' }}
      </button>

      <div v-if="connectionStatus" class="status">
        <p>{{ connectionStatus }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useWalletConnectStore } from '../stores/walletConnectStore'
  import QRCode from 'qrcode'

  const walletConnectStore = useWalletConnectStore()

  const isGenerating = ref(false)
  const isConnecting = ref(false)
  const qrCodeData = ref('')
  const connectionStatus = ref('')
  const qrCodeRef = ref<HTMLElement>()

  const testQRCode = async () => {
    try {
      isGenerating.value = true
      qrCodeData.value = 'wc:test-uri-123456789'

      if (qrCodeRef.value) {
        const qrCodeUrl = await QRCode.toDataURL(qrCodeData.value, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })

        qrCodeRef.value.innerHTML = `<img src="${qrCodeUrl}" alt="Test QR Code" />`
      }
    } catch (error) {
      console.error('QR Code generation failed:', error)
    } finally {
      isGenerating.value = false
    }
  }

  const testConnection = async () => {
    try {
      isConnecting.value = true
      connectionStatus.value = 'Testing connection...'

      await walletConnectStore.initialize()
      const connectionData = await walletConnectStore.startConnection()

      if (connectionData) {
        connectionStatus.value = `Connection URI generated: ${connectionData.uri.substring(0, 50)}...`
      } else {
        connectionStatus.value = 'Failed to generate connection URI'
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      connectionStatus.value = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    } finally {
      isConnecting.value = false
    }
  }
</script>

<style scoped>
  .wallet-connect-test {
    @apply p-6 max-w-2xl mx-auto;
  }

  .test-section {
    @apply mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg;
  }

  .test-section h3 {
    @apply text-lg font-semibold mb-4;
  }

  button {
    @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .qr-test {
    @apply mt-4;
  }

  .qr-container {
    @apply flex justify-center mb-4;
  }

  .qr-code {
    @apply p-4 bg-white rounded-lg shadow-sm;
  }

  .status {
    @apply mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg;
  }
</style>
