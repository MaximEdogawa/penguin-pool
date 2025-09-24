<template>
  <div class="content-page">
    <div class="content-body">
      <!-- Quick Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 flex-shrink-0">
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
            <div v-if="isWalletConnected" class="flex items-center space-x-1">
              <button
                @click="handleRefreshBalance(true)"
                :disabled="isBalanceLoading"
                class="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh balance"
              >
                <i :class="['pi', isBalanceLoading ? 'pi-spin pi-spinner' : 'pi-refresh']"></i>
              </button>

              <button
                @click="toggleAutoRefresh"
                :class="[
                  'p-2 transition-colors',
                  autoRefreshEnabled
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 hover:text-primary-600 dark:hover:text-primary-400',
                ]"
                :title="
                  autoRefreshEnabled
                    ? 'Disable auto-refresh'
                    : `Enable auto-refresh (every ${AUTO_REFRESH_INTERVAL / 60000} minutes)`
                "
              >
                <i :class="['pi', autoRefreshEnabled ? 'pi-clock-fill' : 'pi-clock']"></i>
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <p class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {{ userBalance }} {{ ticker }}
              </p>
              <div v-if="isBalanceLoading" class="loading-spinner">
                <i class="pi pi-spin pi-spinner text-sm text-primary-600"></i>
              </div>
            </div>

            <!-- Additional balance info when connected -->
            <div v-if="isWalletConnected && walletBalance" class="space-y-1">
              <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Spendable:</span>
                <span>{{ spendableBalance }} {{ ticker }}</span>
              </div>
              <div
                v-if="false"
                class="flex justify-between text-xs text-gray-500 dark:text-gray-400"
              >
                <span>Unconfirmed:</span>
                <span>{{ formatBalance(0) }} {{ ticker }}</span>
              </div>
            </div>

            <!-- Wallet Address (only when connected) -->
            <div
              v-if="isWalletConnected && walletDataService.address.data.value?.address"
              class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2 min-w-0 flex-1">
                  <i
                    class="pi pi-id-card text-xs text-gray-500 dark:text-gray-400 flex-shrink-0"
                  ></i>
                  <span
                    class="text-xs text-gray-600 dark:text-gray-400 font-mono truncate cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    :title="walletDataService.address.data.value?.address || undefined"
                    @click="copyAddress"
                  >
                    {{ formatAddress(walletDataService.address.data.value?.address ?? '') }}
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
      <div class="card p-4 sm:p-6 flex-shrink-0">
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
            @click="navigateToWallet"
            class="flex flex-col items-center justify-center p-4 sm:p-6 rounded-lg border-2 border-dashed border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
          >
            <i
              class="pi pi-send text-base sm:text-lg mb-2 text-primary-600 dark:text-primary-400"
            ></i>
            <span
              class="text-xs sm:text-sm font-medium text-primary-700 dark:text-primary-300 text-center"
              >Send Transaction</span
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
      <div class="card p-3 sm:p-4 flex-1 min-h-0 max-h-64 lg:max-h-80">
        <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
          Recent Activity
        </h2>
        <div class="space-y-2 sm:space-y-3 overflow-y-auto h-full">
          <div
            class="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <div class="flex-shrink-0">
              <i class="pi pi-info-circle text-blue-500 text-xs sm:text-sm"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-900 dark:text-white truncate">
                Welcome to Penguin Pool!
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Just now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/entities/user/store/userStore'
  import { useConnectionDataService } from '@/features/walletConnect/services/ConnectionDataService'
  import { useWalletDataService } from '@/features/walletConnect/services/WalletDataService'
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { useRouter } from 'vue-router'

  const userStore = ref<ReturnType<typeof useUserStore> | null>(null)
  const connectionService = useConnectionDataService()
  const walletDataService = useWalletDataService()
  const router = useRouter()

  const isWalletConnected = computed(() => connectionService.state.value.isConnected)
  const walletBalance = computed(() => walletDataService.balance.data.value || null)
  const isBalanceLoading = computed(() => walletDataService.balance.isLoading.value)
  const balanceLastUpdated = ref<Date | null>(null)
  const autoRefreshEnabled = ref(true)

  // Format balance for display
  const formatBalance = (mojos: number): string => {
    if (mojos === 0) return '0.000000'
    return (mojos / 1000000000000).toFixed(6)
  }

  // Get formatted balance
  const userBalance = computed(() => {
    if (!walletBalance.value || !walletBalance.value.confirmed) return '0.000000'
    return formatBalance(parseInt(walletBalance.value.confirmed))
  })

  // Get spendable balance
  const spendableBalance = computed(() => {
    if (!walletBalance.value || !walletBalance.value.spendable) return '0.000000'
    return formatBalance(parseInt(walletBalance.value.spendable))
  })

  // Get ticker symbol
  const ticker = computed(() => {
    const chainId = connectionService.state.value.chainId
    return chainId?.includes('testnet') ? 'TXCH' : 'XCH'
  })

  // Actions
  const refreshBalance = async (force = false) => {
    if (!isWalletConnected.value) {
      console.warn('⚠️ Not connected to wallet, cannot refresh balance')
      return
    }

    if (isBalanceLoading.value && !force) {
      console.log('⏰ Balance refresh already in progress, skipping')
      return
    }

    try {
      console.log('💰 Refreshing wallet balance...')
      await walletDataService.balance.refetch()
      balanceLastUpdated.value = new Date()
      console.log('✅ Wallet balance refreshed successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Failed to refresh wallet balance:', errorMessage)
    }
  }

  const startAutoRefresh = () => {
    if (autoRefreshEnabled.value) {
      console.log('🔄 Starting auto-refresh')
      // Auto-refresh every 5 minutes
      setInterval(
        () => {
          if (isWalletConnected.value) {
            refreshBalance()
          }
        },
        5 * 60 * 1000
      )
    }
  }

  const stopAutoRefresh = () => {
    console.log('⏹️ Stopping auto-refresh')
    autoRefreshEnabled.value = false
  }

  const toggleAutoRefresh = () => {
    if (autoRefreshEnabled.value) {
      stopAutoRefresh()
    } else {
      autoRefreshEnabled.value = true
      startAutoRefresh()
    }
  }

  // Constants
  const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes in milliseconds

  const formatAddress = (address: string): string => {
    if (!address) return ''
    if (address.length <= 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const navigateToWallet = () => {
    router.push('/wallet')
  }

  const copyAddress = async () => {
    const address = walletDataService.address.data.value?.address
    if (!address) return

    try {
      await navigator.clipboard.writeText(address)
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
    }
  }

  const handleRefreshBalance = async (force = false) => {
    console.log('💰 Dashboard: Refreshing wallet balance...')
    await refreshBalance(force)
    console.log('✅ Dashboard: Wallet balance refreshed successfully')
  }

  const connectWallet = () => {
    window.location.href = '/wallet-connect'
  }

  onMounted(async () => {
    try {
      userStore.value = useUserStore()
    } catch (error) {
      console.error('Failed to initialize dashboard:', error)
    }
  })

  onUnmounted(() => {
    // Cleanup is handled by useBalance composable
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
