<template>
  <div class="appkit-test-page">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">AppKit Multichain Integration Test</h1>

      <!-- AppKit Wallet Button -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Wallet Connection</h2>
        <AppKitWalletButton />
      </div>

      <!-- AppKit Wallet Modal -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Wallet Modal</h2>
        <button
          @click="showModal = true"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open Wallet Modal
        </button>
        <AppKitWalletModal
          :is-open="showModal"
          @close="showModal = false"
          @connected="handleWalletConnected"
        />
      </div>

      <!-- Connection Status -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Connection Status</h2>
        <div class="bg-gray-100 p-4 rounded-lg">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="font-medium">Connected:</span>
              <span :class="isConnected ? 'text-green-600' : 'text-red-600'">
                {{ isConnected ? 'Yes' : 'No' }}
              </span>
            </div>
            <div>
              <span class="font-medium">Connecting:</span>
              <span :class="isConnecting ? 'text-yellow-600' : 'text-gray-600'">
                {{ isConnecting ? 'Yes' : 'No' }}
              </span>
            </div>
            <div>
              <span class="font-medium">Initialized:</span>
              <span :class="isInitialized ? 'text-green-600' : 'text-red-600'">
                {{ isInitialized ? 'Yes' : 'No' }}
              </span>
            </div>
            <div>
              <span class="font-medium">Chain ID:</span>
              <span class="font-mono">{{ chainId || 'None' }}</span>
            </div>
            <div class="col-span-2">
              <span class="font-medium">Accounts:</span>
              <div class="mt-2">
                <div v-if="accounts.length === 0" class="text-gray-500">No accounts</div>
                <div v-else class="space-y-1">
                  <div v-for="account in accounts" :key="account" class="font-mono text-sm">
                    {{ account }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Network Information -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Network Information</h2>
        <div class="bg-gray-100 p-4 rounded-lg">
          <div v-if="currentNetwork" class="space-y-2">
            <div><span class="font-medium">Name:</span> {{ currentNetwork.name }}</div>
            <div>
              <span class="font-medium">Currency:</span> {{ currentNetwork.nativeCurrency.symbol }}
            </div>
            <div><span class="font-medium">Chain ID:</span> {{ currentNetwork.id }}</div>
            <div>
              <span class="font-medium">RPC URL:</span> {{ currentNetwork.rpcUrls.default.http[0] }}
            </div>
            <div>
              <span class="font-medium">Explorer:</span>
              <a
                :href="currentNetwork.blockExplorers.default.url"
                target="_blank"
                class="text-blue-600 hover:underline"
              >
                {{ currentNetwork.blockExplorers.default.url }}
              </a>
            </div>
          </div>
          <div v-else class="text-gray-500">No network selected</div>
        </div>
      </div>

      <!-- Supported Networks -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Supported Networks</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="network in supportedNetworks"
            :key="network.id"
            class="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <i :class="getNetworkIcon(network.id)" class="text-lg"></i>
              </div>
              <div>
                <div class="font-medium">{{ network.name }}</div>
                <div class="text-sm text-gray-500">{{ network.nativeCurrency.symbol }}</div>
              </div>
            </div>
            <div class="text-xs text-gray-400 font-mono">{{ network.id }}</div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Actions</h2>
        <div class="flex gap-4">
          <button
            @click="handleConnect"
            :disabled="isConnecting"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isConnecting ? 'Connecting...' : 'Connect' }}
          </button>
          <button
            @click="handleDisconnect"
            :disabled="!isConnected"
            class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Disconnect
          </button>
          <button
            @click="handleRefresh"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Error</h2>
        <div class="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppKitWalletButton from '@/features/walletConnect/components/AppKitWalletButton.vue'
  import AppKitWalletModal from '@/features/walletConnect/components/AppKitWalletModal.vue'
  import { useWalletConnect } from '@/features/walletConnect/composables/useWalletConnect'
  import { onMounted, ref } from 'vue'

  const {
    isConnected,
    isConnecting,
    isInitialized,
    accounts,
    chainId,
    error,
    currentNetwork,
    getSupportedNetworks,
    connect,
    disconnect,
  } = useWalletConnect()

  const showModal = ref(false)
  const supportedNetworks = getSupportedNetworks()

  const handleConnect = async () => {
    try {
      const result = await connect()
      if (result.success) {
        console.log('Connected successfully:', result)
      } else {
        console.error('Connection failed:', result.error)
      }
    } catch (error) {
      console.error('Connection error:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      const result = await disconnect()
      if (result.success) {
        console.log('Disconnected successfully')
      } else {
        console.error('Disconnect failed:', result.error)
      }
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  const handleRefresh = () => {
    // Force a refresh of the state
    window.location.reload()
  }

  const handleWalletConnected = (walletInfo: unknown) => {
    console.log('Wallet connected:', walletInfo)
    showModal.value = false
  }

  const getNetworkIcon = (networkId: string): string => {
    if (networkId.startsWith('chia:')) return 'pi pi-circle-fill text-green-500'
    if (networkId.startsWith('eip155:')) return 'pi pi-circle-fill text-blue-500'
    if (networkId.startsWith('solana:')) return 'pi pi-circle-fill text-purple-500'
    if (networkId.startsWith('bitcoin:')) return 'pi pi-circle-fill text-orange-500'
    return 'pi pi-circle-fill text-gray-500'
  }

  onMounted(() => {
    console.log('AppKit Test Page mounted')
    console.log('Supported networks:', supportedNetworks)
  })
</script>

<style scoped>
  .appkit-test-page {
    min-height: 100vh;
    background-color: #f9fafb;
  }
</style>
