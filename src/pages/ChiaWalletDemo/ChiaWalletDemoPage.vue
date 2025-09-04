<template>
  <div class="chia-wallet-demo">
    <div class="demo-header">
      <h1>Chia WalletConnect Demo</h1>
      <p>Test the Chia WalletConnect integration</p>
    </div>

    <div class="demo-content">
      <!-- Connection Status -->
      <div class="status-card">
        <h2>Connection Status</h2>
        <div class="status-info">
          <div class="status-item">
            <span class="label">Connected:</span>
            <span :class="['value', isConnected ? 'connected' : 'disconnected']">
              {{ isConnected ? 'Yes' : 'No' }}
            </span>
          </div>
          <div class="status-item" v-if="chiaState.fingerprint">
            <span class="label">Fingerprint:</span>
            <span class="value">{{ chiaState.fingerprint }}</span>
          </div>
          <div class="status-item" v-if="walletInfo?.address">
            <span class="label">Address:</span>
            <span class="value address">{{ walletInfo.address }}</span>
          </div>
          <div class="status-item" v-if="walletInfo?.balance">
            <span class="label">Balance:</span>
            <span class="value">
              {{ formatBalance(walletInfo.balance.confirmed_wallet_balance) }} XCH
            </span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-card">
        <h2>Actions</h2>
        <div class="action-buttons">
          <button
            @click="connectWallet"
            :disabled="isConnecting || isConnected"
            class="btn btn-primary"
          >
            {{ isConnecting ? 'Connecting...' : 'Connect Wallet' }}
          </button>

          <button @click="disconnectWallet" :disabled="!isConnected" class="btn btn-secondary">
            Disconnect
          </button>

          <button @click="refreshWalletInfo" :disabled="!isConnected" class="btn btn-outline">
            Refresh Info
          </button>
        </div>
      </div>

      <!-- RPC Tests -->
      <div class="rpc-tests-card" v-if="isConnected">
        <h2>RPC Tests</h2>
        <div class="test-buttons">
          <button @click="testGetSyncStatus" class="btn btn-outline">Get Sync Status</button>
          <button @click="testGetWallets" class="btn btn-outline">Get Wallets</button>
          <button @click="testGetCurrentAddress" class="btn btn-outline">
            Get Current Address
          </button>
          <button @click="testGetWalletBalance" class="btn btn-outline">Get Wallet Balance</button>
        </div>
      </div>

      <!-- Results -->
      <div class="results-card" v-if="lastResult">
        <h2>Last Result</h2>
        <pre class="result-json">{{ JSON.stringify(lastResult, null, 2) }}</pre>
      </div>

      <!-- Error Display -->
      <div class="error-card" v-if="error">
        <h2>Error</h2>
        <p class="error-message">{{ error }}</p>
        <button @click="clearError" class="btn btn-outline">Clear</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useWalletConnectStore } from '@/features/walletConnect/stores/walletConnectStore'
  import { ChiaWalletTest } from '@/features/walletConnect/utils/chia-wallet-test'

  const walletStore = useWalletConnectStore()

  // State
  const lastResult = ref<Record<string, unknown> | null>(null)
  const error = ref<string | null>(null)

  // Computed
  const isConnected = computed(() => walletStore.isConnected)
  const isConnecting = computed(() => walletStore.isConnecting)
  const chiaState = computed(() => walletStore.getChiaConnectionState)
  const walletInfo = computed(() => walletStore.getWalletInfo)

  // Methods
  const connectWallet = async () => {
    try {
      error.value = null
      const result = await walletStore.connect()
      if (!result.success) {
        error.value = result.error || 'Connection failed'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Connection failed'
    }
  }

  const disconnectWallet = async () => {
    try {
      error.value = null
      await walletStore.disconnect()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Disconnect failed'
    }
  }

  const refreshWalletInfo = async () => {
    try {
      error.value = null
      // The wallet info will be automatically updated
      lastResult.value = { message: 'Wallet info refreshed' }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Refresh failed'
    }
  }

  const testGetSyncStatus = async () => {
    try {
      error.value = null
      const result = await walletStore.makeChiaRequest('chia_getSyncStatus', {})
      lastResult.value = result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'RPC request failed'
    }
  }

  const testGetWallets = async () => {
    try {
      error.value = null
      const result = await walletStore.makeChiaRequest('chia_getWallets', { includeData: true })
      lastResult.value = result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'RPC request failed'
    }
  }

  const testGetCurrentAddress = async () => {
    try {
      error.value = null
      const result = await walletStore.makeChiaRequest('chia_getCurrentAddress', { walletId: 1 })
      lastResult.value = result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'RPC request failed'
    }
  }

  const testGetWalletBalance = async () => {
    try {
      error.value = null
      const result = await walletStore.makeChiaRequest('chia_getWalletBalance', { walletId: 1 })
      lastResult.value = result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'RPC request failed'
    }
  }

  const clearError = () => {
    error.value = null
  }

  const formatBalance = (mojos: number): string => {
    return (mojos / 1000000000000).toFixed(6)
  }

  // Initialize on mount
  onMounted(async () => {
    try {
      await walletStore.initialize()
      console.log('Chia WalletConnect initialized')

      // Run tests in development
      if (import.meta.env.DEV) {
        await ChiaWalletTest.runAllTests()
      }
    } catch (err) {
      console.error('Failed to initialize Chia WalletConnect:', err)
    }
  })
</script>

<style scoped>
  .chia-wallet-demo {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .demo-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .demo-header h1 {
    color: #3b82f6;
    margin-bottom: 0.5rem;
  }

  .demo-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .status-card,
  .actions-card,
  .rpc-tests-card,
  .results-card,
  .error-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .status-card h2,
  .actions-card h2,
  .rpc-tests-card h2,
  .results-card h2,
  .error-card h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #374151;
  }

  .status-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .status-item:last-child {
    border-bottom: none;
  }

  .label {
    font-weight: 500;
    color: #6b7280;
  }

  .value {
    font-family: monospace;
    font-weight: 600;
  }

  .value.connected {
    color: #10b981;
  }

  .value.disconnected {
    color: #ef4444;
  }

  .value.address {
    font-size: 0.875rem;
    word-break: break-all;
  }

  .action-buttons,
  .test-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #4b5563;
  }

  .btn-outline {
    background: transparent;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-outline:hover:not(:disabled) {
    background: #f9fafb;
  }

  .result-json {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    padding: 1rem;
    font-size: 0.875rem;
    overflow-x: auto;
    max-height: 300px;
    overflow-y: auto;
  }

  .error-card {
    border-color: #fca5a5;
    background: #fef2f2;
  }

  .error-message {
    color: #dc2626;
    margin-bottom: 1rem;
  }
</style>
