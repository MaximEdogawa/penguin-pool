<template>
  <div class="content-page">
    <div class="content-header">
      <div class="card p-4 sm:p-6">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Wallet Balance
          </h2>
          <div class="flex items-center space-x-2">
            <i class="pi pi-wallet text-lg text-primary-600"></i>
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ ticker }}</span>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <div class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {{ userBalance }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Available Balance</div>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ formatAddress(walletDataService.address.data.value?.address || '') }}
            </div>
            <button
              @click="copyAddress"
              class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              {{ isAddressCopied ? 'Copied!' : 'Copy Address' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="content-body">
      <!-- Wallet Balance Card -->

      <!-- Send Transaction Section -->
      <div class="card p-4 sm:p-6">
        <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Send Transaction
        </h2>

        <SendTransactionComponent
          :wallet-id="1"
          :available-balance="parseFloat(userBalance)"
          :ticker="ticker"
        />
      </div>

      <!-- Recent Transactions (placeholder) -->
      <div class="card p-4 sm:p-6 mt-6">
        <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Transactions
        </h2>
        <div class="text-center py-8">
          <i class="pi pi-history text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-600 dark:text-gray-400">Transaction history will be displayed here</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import SendTransactionComponent from '@/components/SendTransaction/SendTransactionComponent.vue'
  import { useSessionDataService } from '@/features/walletConnect/services/SessionDataService'
  import { useWalletDataService } from '@/features/walletConnect/services/WalletDataService'
  import { computed, ref } from 'vue'

  const walletDataService = useWalletDataService()
  const session = useSessionDataService()
  const isAddressCopied = ref(false)
  const userBalance = computed(() => {
    if (walletDataService.balance.data.value?.confirmed) {
      return formatBalance(parseInt(walletDataService.balance.data.value.confirmed))
    }
    return '0.000000'
  })

  const ticker = computed(() => {
    if (session.chainId.value?.includes('testnet')) {
      return 'TXCH'
    }
    return 'XCH'
  })

  const formatBalance = (mojos: number): string => {
    if (mojos === 0) return '0.000000'
    return (mojos / 1000000000000).toFixed(6)
  }

  const formatAddress = (address: string): string => {
    if (!address) return ''
    if (address.length <= 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyAddress = async () => {
    try {
      const address = walletDataService.address.data.value?.address
      if (address) {
        await navigator.clipboard.writeText(address)
        isAddressCopied.value = true
        setTimeout(() => {
          isAddressCopied.value = false
        }, 2000)
      }
    } catch {
      // Failed to copy address
    }
  }
</script>

<style scoped>
  .content-page {
    @apply min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8;
  }

  .content-header {
    @apply mb-1;
  }

  .content-body {
    @apply space-y-1;
  }

  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
  }
</style>
