<template>
  <div class="content-page">
    <div class="content-body">
      <!-- Quick Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div class="card p-4 sm:p-6">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <i
                  :class="[
                    'pi text-xl sm:text-2xl',
                    isWalletConnected ? 'pi-wallet text-primary-600' : 'pi-wallet text-gray-400',
                  ]"
                ></i>
              </div>
              <h3 class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Wallet Balance
              </h3>
            </div>
            <button
              v-if="isWalletConnected"
              @click="refreshBalance"
              :disabled="isBalanceLoading"
              class="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              title="Refresh balance"
            >
              <i :class="['pi', isBalanceLoading ? 'pi-spin pi-spinner' : 'pi-refresh']"></i>
            </button>
          </div>

          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <p class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {{ userBalance }} XCH
              </p>
              <div v-if="isBalanceLoading" class="loading-spinner">
                <i class="pi pi-spin pi-spinner text-sm text-primary-600"></i>
              </div>
            </div>

            <!-- Additional balance info when connected -->
            <div v-if="isWalletConnected && walletStore.walletInfo?.balance" class="space-y-1">
              <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Spendable:</span>
                <span
                  >{{ formatBalance(walletStore.walletInfo.balance.spendable_balance) }} XCH</span
                >
              </div>
              <div
                v-if="walletStore.walletInfo.balance.unconfirmed_wallet_balance > 0"
                class="flex justify-between text-xs text-gray-500 dark:text-gray-400"
              >
                <span>Unconfirmed:</span>
                <span
                  >{{
                    formatBalance(walletStore.walletInfo.balance.unconfirmed_wallet_balance)
                  }}
                  XCH</span
                >
              </div>
            </div>

            <!-- Wallet Address (only when connected) -->
            <div
              v-if="isWalletConnected && walletStore.walletInfo?.address"
              class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2 min-w-0 flex-1">
                  <i
                    class="pi pi-id-card text-xs text-gray-500 dark:text-gray-400 flex-shrink-0"
                  ></i>
                  <span
                    class="text-xs text-gray-600 dark:text-gray-400 font-mono truncate cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    :title="walletStore.walletInfo.address"
                    @click="copyAddress"
                  >
                    {{ formatAddress(walletStore.walletInfo.address) }}
                  </span>
                </div>
                <button
                  @click="copyAddress"
                  class="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  title="Copy address"
                >
                  <i class="pi pi-copy text-xs"></i>
                </button>
              </div>
            </div>

            <!-- Connection status -->
            <div v-if="!isWalletConnected" class="text-xs text-orange-600 dark:text-orange-400">
              <i class="pi pi-exclamation-triangle mr-1"></i>
              Wallet not connected
            </div>
            <div v-else-if="isWalletConnected" class="text-xs text-green-600 dark:text-green-400">
              <i class="pi pi-check-circle mr-1"></i>
              Wallet connected
            </div>
          </div>
        </div>

        <div class="card p-4 sm:p-6 flex items-center space-x-3 sm:space-x-4">
          <div class="flex-shrink-0">
            <i class="pi pi-chart-line text-xl sm:text-2xl text-success-600"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
              Active Loans
            </h3>
            <p class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">0</p>
          </div>
        </div>

        <div class="card p-4 sm:p-6 flex items-center space-x-3 sm:space-x-4">
          <div class="flex-shrink-0">
            <i class="pi pi-file text-xl sm:text-2xl text-warning-600"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
              Contracts
            </h3>
            <p class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">0</p>
          </div>
        </div>

        <div class="card p-4 sm:p-6 flex items-center space-x-3 sm:space-x-4">
          <div class="flex-shrink-0">
            <i class="pi pi-coins text-xl sm:text-2xl text-accent-600"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
              Piggy Bank
            </h3>
            <p class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
              0 coins
            </p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card p-4 sm:p-6">
        <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Quick Actions
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <!-- Wallet Connect Action (only show if not connected) -->
          <button
            v-if="!isWalletConnected"
            @click="connectWallet"
            :disabled="isBalanceLoading"
            class="flex flex-col items-center justify-center p-4 sm:p-6 rounded-lg border-2 border-dashed border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:border-orange-500 dark:hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-200"
          >
            <i
              class="pi pi-wallet text-base sm:text-lg mb-2 text-orange-600 dark:text-orange-400"
            ></i>
            <span
              class="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300 text-center"
              >Connect Wallet</span
            >
          </button>

          <button
            v-else
            class="flex flex-col items-center justify-center p-4 sm:p-6 rounded-lg border-2 border-dashed border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
          >
            <i class="pi pi-plus text-base sm:text-lg mb-2 text-gray-600 dark:text-gray-400"></i>
            <span
              class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 text-center"
              >Create Contract</span
            >
          </button>

          <button
            class="flex flex-col items-center justify-center p-4 sm:p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
          >
            <i
              class="pi pi-hand-holding-usd text-base sm:text-lg mb-2 text-gray-600 dark:text-gray-400"
            ></i>
            <span
              class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 text-center"
              >Make Offer</span
            >
          </button>
          <button
            class="flex flex-col items-center justify-center p-4 sm:p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200 sm:col-span-2 lg:col-span-1"
          >
            <i class="pi pi-search text-base sm:text-lg mb-2 text-gray-600 dark:text-gray-400"></i>
            <span
              class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 text-center"
              >Browse Offers</span
            >
          </button>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card p-4 sm:p-6">
        <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Recent Activity
        </h2>
        <div class="space-y-3 sm:space-y-4">
          <div
            class="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <div class="flex-shrink-0">
              <i class="pi pi-info-circle text-blue-500 text-sm sm:text-base"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                Welcome to Penguin Pool!
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Just now</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Page Footer -->
    <PageFooter />
  </div>
</template>

<script setup lang="ts">
  import PageFooter from '@/components/PageFooter.vue'
  import { useUserStore } from '@/entities/user/store/userStore'
  import { useWalletConnectStore } from '@/features/walletConnect/stores/walletConnectStore'
  import { computed, onMounted, ref, watch } from 'vue'

  const userStore = ref<ReturnType<typeof useUserStore> | null>(null)
  const walletStore = useWalletConnectStore()

  // Computed properties for wallet balance
  const userBalance = computed(() => {
    if (walletStore.walletInfo?.balance) {
      return formatBalance(walletStore.walletInfo.balance.confirmed_wallet_balance)
    }
    return '0.00'
  })

  const isWalletConnected = computed(() => walletStore.isConnected)
  const isBalanceLoading = computed(() => walletStore.isConnecting)

  // Format balance helper
  const formatBalance = (mojos: number): string => {
    if (mojos === 0) return '0.000000'
    return (mojos / 1000000000000).toFixed(6)
  }

  // Format address helper - show first 6 and last 4 characters
  const formatAddress = (address: string): string => {
    if (!address) return ''
    if (address.length <= 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!walletStore.walletInfo?.address) return

    try {
      await navigator.clipboard.writeText(walletStore.walletInfo.address)
      // Visual feedback - you could enhance this with a proper toast notification
      console.log('Address copied to clipboard')

      // Simple visual feedback by temporarily changing the copy button
      const copyButton = document.querySelector('[title="Copy address"]') as HTMLElement
      if (copyButton) {
        const originalIcon = copyButton.innerHTML
        copyButton.innerHTML = '<i class="pi pi-check text-xs"></i>'
        copyButton.style.color = 'rgb(34, 197, 94)' // green-500
        setTimeout(() => {
          copyButton.innerHTML = originalIcon
          copyButton.style.color = ''
        }, 1500)
      }
    } catch (error) {
      console.error('Failed to copy address:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = walletStore.walletInfo.address
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)

      // Visual feedback for fallback
      const copyButton = document.querySelector('[title="Copy address"]') as HTMLElement
      if (copyButton) {
        const originalIcon = copyButton.innerHTML
        copyButton.innerHTML = '<i class="pi pi-check text-xs"></i>'
        copyButton.style.color = 'rgb(34, 197, 94)' // green-500
        setTimeout(() => {
          copyButton.innerHTML = originalIcon
          copyButton.style.color = ''
        }, 1500)
      }
    }
  }

  // Flag to prevent multiple simultaneous balance refresh calls
  let isRefreshingBalance = false

  // Refresh wallet balance
  const refreshBalance = async () => {
    if (isWalletConnected.value && !isRefreshingBalance) {
      isRefreshingBalance = true
      try {
        await walletStore.refreshWalletInfo()
        console.log('Wallet balance refreshed successfully')
      } catch (error) {
        console.error('Failed to refresh wallet balance:', error)
      } finally {
        isRefreshingBalance = false
      }
    }
  }

  // Connect wallet
  const connectWallet = () => {
    // Redirect to wallet connect page
    window.location.href = '/wallet-connect'
  }

  onMounted(async () => {
    try {
      userStore.value = useUserStore()

      // Initialize wallet connect if not already done
      await walletStore.initialize()

      // If wallet is connected, refresh balance
      if (isWalletConnected.value) {
        await refreshBalance()
      }
    } catch (error) {
      console.error('Failed to initialize dashboard:', error)
    }
  })

  // Watch for wallet connection changes
  watch(isWalletConnected, async connected => {
    if (connected) {
      console.log('Wallet connected, refreshing balance...')
      await refreshBalance()
    }
  })
</script>

<style scoped>
  .loading-spinner {
    @apply flex items-center justify-center;
  }

  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
  }
</style>
