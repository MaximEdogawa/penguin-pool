<template>
  <div class="ios-wallet-connect-container">
    <!-- iOS-specific connection status -->
    <div v-if="isIOSDevice" class="ios-status-indicator">
      <div class="status-item">
        <span class="label">Connection Status:</span>
        <span :class="['status', connectionStatus]">{{ connectionStatus }}</span>
      </div>

      <div v-if="isHealing" class="status-item">
        <span class="label">Healing:</span>
        <span class="healing-indicator">🔄</span>
      </div>

      <div v-if="websocketStatus !== 'connected'" class="status-item">
        <span class="label">WebSocket:</span>
        <span :class="['websocket-status', websocketStatus]">{{ websocketStatus }}</span>
      </div>

      <div v-if="connectionAttempts > 0" class="status-item">
        <span class="label">Attempts:</span>
        <span class="attempts">{{ connectionAttempts }}/5</span>
      </div>
    </div>

    <!-- Connection Button -->
    <button
      :disabled="!canConnect && !canDisconnect"
      :class="[
        'wallet-connect-button',
        {
          connecting: isConnecting,
          connected: isConnected,
          healing: isHealing,
          error: !!error,
          ios: isIOSDevice,
        },
      ]"
      @click="handleConnection"
    >
      <span v-if="isConnecting" class="button-content">
        <span class="spinner">🔄</span>
        Connecting...
      </span>

      <span v-else-if="isHealing" class="button-content">
        <span class="spinner">🔄</span>
        Healing Connection...
      </span>

      <span v-else-if="isConnected" class="button-content">
        <span class="icon">✅</span>
        Disconnect Wallet
      </span>

      <span v-else class="button-content">
        <span class="icon">🍎</span>
        Connect iOS Wallet
      </span>
    </button>

    <!-- Error Display -->
    <div v-if="error" class="error-container">
      <div class="error-message">
        <span class="error-icon">⚠️</span>
        {{ error }}
      </div>

      <!-- iOS-specific error actions -->
      <div v-if="isIOSDevice && error" class="error-actions">
        <button class="heal-button" :disabled="isHealing" @click="handleHealConnection">
          🔄 Heal Connection
        </button>

        <button class="retry-button" :disabled="isConnecting" @click="handleRetryConnection">
          🔄 Retry Connection
        </button>

        <button class="clear-button" @click="clearError">✕ Clear Error</button>
      </div>
    </div>

    <!-- Connection Info -->
    <div v-if="isConnected && isIOSDevice" class="connection-info">
      <div class="info-item">
        <span class="label">Accounts:</span>
        <span class="value">{{ accounts.length }}</span>
      </div>

      <div class="info-item">
        <span class="label">Chain:</span>
        <span class="value">{{ chainId }}</span>
      </div>

      <div class="info-item">
        <span class="label">WebSocket:</span>
        <span :class="['value', websocketStatus]">{{ websocketStatus }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useIOSWalletConnect } from '@/features/walletConnect/composables/useIOSWalletConnect'

  const {
    isIOSDevice,
    isConnected,
    isConnecting,
    isHealing,
    accounts,
    chainId,
    error,
    websocketStatus,
    connectionAttempts,
    connectionStatus,
    canConnect,
    canDisconnect,
    connect,
    disconnect,
    healConnection,
    clearError,
  } = useIOSWalletConnect()

  const handleConnection = async () => {
    if (canConnect.value) {
      const result = await connect()
      if (!result.success) {
        // Connection failed
      }
    } else if (canDisconnect.value) {
      const result = await disconnect()
      if (!result.success) {
        // Disconnection failed
      }
    }
  }

  const handleHealConnection = async () => {
    const result = await healConnection()
    if (!result.success) {
      // Healing failed
    }
  }

  const handleRetryConnection = async () => {
    clearError()
    const result = await connect()
    if (!result.success) {
      // Retry failed
    }
  }
</script>

<style scoped>
  .ios-wallet-connect-container {
    @apply flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md;
  }

  .ios-status-indicator {
    @apply flex flex-wrap gap-2 text-sm;
  }

  .status-item {
    @apply flex items-center gap-1 px-2 py-1 bg-gray-100 rounded;
  }

  .label {
    @apply font-medium text-gray-600;
  }

  .status {
    @apply px-2 py-1 rounded text-xs font-medium;
  }

  .status.connected {
    @apply bg-green-100 text-green-800;
  }

  .status.connecting {
    @apply bg-blue-100 text-blue-800;
  }

  .status.healing {
    @apply bg-yellow-100 text-yellow-800;
  }

  .status.error {
    @apply bg-red-100 text-red-800;
  }

  .status.disconnected {
    @apply bg-gray-100 text-gray-800;
  }

  .websocket-status {
    @apply px-2 py-1 rounded text-xs font-medium;
  }

  .websocket-status.connected {
    @apply bg-green-100 text-green-800;
  }

  .websocket-status.connecting {
    @apply bg-blue-100 text-blue-800;
  }

  .websocket-status.disconnected {
    @apply bg-gray-100 text-gray-800;
  }

  .websocket-status.error {
    @apply bg-red-100 text-red-800;
  }

  .healing-indicator {
    @apply animate-spin;
  }

  .attempts {
    @apply font-mono text-xs;
  }

  .wallet-connect-button {
    @apply w-full px-6 py-3 rounded-lg font-medium transition-all duration-200;
    @apply flex items-center justify-center gap-2;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .wallet-connect-button:not(:disabled) {
    @apply hover:shadow-lg active:scale-95;
  }

  .wallet-connect-button.ios {
    @apply bg-blue-600 text-white;
  }

  .wallet-connect-button.ios:hover:not(:disabled) {
    @apply bg-blue-700;
  }

  .wallet-connect-button.connecting {
    @apply bg-blue-500;
  }

  .wallet-connect-button.connected {
    @apply bg-red-600;
  }

  .wallet-connect-button.connected:hover:not(:disabled) {
    @apply bg-red-700;
  }

  .wallet-connect-button.healing {
    @apply bg-yellow-500;
  }

  .wallet-connect-button.error {
    @apply bg-red-500;
  }

  .button-content {
    @apply flex items-center gap-2;
  }

  .spinner {
    @apply animate-spin;
  }

  .icon {
    @apply text-lg;
  }

  .error-container {
    @apply bg-red-50 border border-red-200 rounded-lg p-4;
  }

  .error-message {
    @apply flex items-center gap-2 text-red-800 font-medium;
  }

  .error-icon {
    @apply text-lg;
  }

  .error-actions {
    @apply flex flex-wrap gap-2 mt-3;
  }

  .heal-button,
  .retry-button,
  .clear-button {
    @apply px-3 py-1 text-xs rounded font-medium transition-colors;
  }

  .heal-button {
    @apply bg-yellow-100 text-yellow-800 hover:bg-yellow-200;
  }

  .retry-button {
    @apply bg-blue-100 text-blue-800 hover:bg-blue-200;
  }

  .clear-button {
    @apply bg-gray-100 text-gray-800 hover:bg-gray-200;
  }

  .heal-button:disabled,
  .retry-button:disabled {
    @apply opacity-50 cursor-not-allowed;
  }

  .connection-info {
    @apply bg-green-50 border border-green-200 rounded-lg p-4;
  }

  .info-item {
    @apply flex justify-between items-center py-1;
  }

  .info-item .value {
    @apply font-mono text-sm;
  }

  .info-item .value.connected {
    @apply text-green-600;
  }

  .info-item .value.connecting {
    @apply text-blue-600;
  }

  .info-item .value.disconnected {
    @apply text-gray-600;
  }

  .info-item .value.error {
    @apply text-red-600;
  }

  /* iOS-specific animations */
  @keyframes ios-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .wallet-connect-button.ios.connecting .spinner {
    animation: ios-pulse 1s ease-in-out infinite;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .ios-status-indicator {
      @apply flex-col;
    }

    .error-actions {
      @apply flex-col;
    }

    .heal-button,
    .retry-button,
    .clear-button {
      @apply w-full;
    }
  }
</style>
