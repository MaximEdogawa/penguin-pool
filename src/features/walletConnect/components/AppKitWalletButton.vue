<template>
  <div class="appkit-wallet-button">
    <!-- Connection Button -->
    <button
      v-if="!isConnected"
      @click="handleConnect"
      :disabled="isConnecting"
      class="wallet-connect-btn"
      :class="{ connecting: isConnecting }"
    >
      <span v-if="isConnecting" class="loading-spinner"></span>
      {{ isConnecting ? 'Connecting...' : 'Connect Wallet' }}
    </button>

    <!-- Connected State -->
    <div v-else class="wallet-connected">
      <div class="wallet-info">
        <div class="network-info">
          <span class="network-name">{{ currentNetwork?.name || 'Unknown Network' }}</span>
          <span class="chain-id">{{ chainId }}</span>
        </div>
        <div class="account-info">
          <span class="account-address">{{ formatAddress(primaryAccount) }}</span>
        </div>
      </div>

      <!-- Network Switcher -->
      <div class="network-switcher">
        <select :value="chainId" @change="handleNetworkChange" class="network-select">
          <option value="">Select Network</option>
          <optgroup label="Chia">
            <option v-for="network in chiaNetworks" :key="network.id" :value="network.id">
              {{ network.name }}
            </option>
          </optgroup>
        </select>
      </div>

      <!-- Disconnect Button -->
      <button @click="handleDisconnect" class="disconnect-btn">Disconnect</button>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useWalletConnect } from '../composables/useWalletConnect'

  const {
    isConnected,
    isConnecting,
    chainId,
    error,
    currentNetwork,
    primaryAccount,
    getChiaNetworks,
    connect,
    disconnect,
    switchNetwork,
  } = useWalletConnect()

  // Network lists
  const chiaNetworks = getChiaNetworks()

  // Methods
  const handleConnect = async () => {
    try {
      const result = await connect()
      if (!result.success) {
        console.error('Connection failed:', result.error)
      }
    } catch (error) {
      console.error('Connection error:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      const result = await disconnect()
      if (!result.success) {
        console.error('Disconnect failed:', result.error)
      }
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  const handleNetworkChange = async (event: Event) => {
    const target = event.target as HTMLSelectElement
    const newChainId = target.value

    if (newChainId && newChainId !== chainId.value) {
      try {
        const success = await switchNetwork(newChainId)
        if (!success) {
          console.error('Network switch failed')
          // Reset select to current chain
          target.value = chainId.value || ''
        }
      } catch (error) {
        console.error('Network switch error:', error)
        // Reset select to current chain
        target.value = chainId.value || ''
      }
    }
  }

  const formatAddress = (address: string | null): string => {
    if (!address) return ''
    if (address.length <= 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
</script>

<style scoped>
  .appkit-wallet-button {
    @apply flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md border border-gray-200;
  }

  .wallet-connect-btn {
    @apply px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2;
  }

  .wallet-connect-btn.connecting {
    @apply bg-blue-500;
  }

  .loading-spinner {
    @apply w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin;
  }

  .wallet-connected {
    @apply space-y-4;
  }

  .wallet-info {
    @apply space-y-2;
  }

  .network-info {
    @apply flex items-center gap-2 text-sm;
  }

  .network-name {
    @apply font-medium text-gray-900;
  }

  .chain-id {
    @apply px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs;
  }

  .account-info {
    @apply text-sm text-gray-600;
  }

  .account-address {
    @apply font-mono;
  }

  .network-switcher {
    @apply w-full;
  }

  .network-select {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
  }

  .disconnect-btn {
    @apply px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200;
  }

  .error-message {
    @apply p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .appkit-wallet-button {
      @apply bg-gray-800 border-gray-700;
    }

    .network-name {
      @apply text-gray-100;
    }

    .chain-id {
      @apply bg-gray-700 text-gray-300;
    }

    .account-address {
      @apply text-gray-300;
    }

    .network-select {
      @apply bg-gray-700 border-gray-600 text-gray-100;
    }
  }
</style>
