<template>
  <div class="content-page">
    <div class="content-body">
      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="card p-6 flex items-center space-x-4">
          <div class="flex-shrink-0">
            <i class="pi pi-wallet text-2xl text-primary-600"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Wallet Balance</h3>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ userBalance }} XCH</p>
          </div>
        </div>

        <div class="card p-6 flex items-center space-x-4">
          <div class="flex-shrink-0">
            <i class="pi pi-chart-line text-2xl text-success-600"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Active Loans</h3>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">0</p>
          </div>
        </div>

        <div class="card p-6 flex items-center space-x-4">
          <div class="flex-shrink-0">
            <i class="pi pi-file text-2xl text-warning-600"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Contracts</h3>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">0</p>
          </div>
        </div>

        <div class="card p-6 flex items-center space-x-4">
          <div class="flex-shrink-0">
            <i class="pi pi-coins text-2xl text-accent-600"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Piggy Bank</h3>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">0 coins</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            class="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
          >
            <i class="pi pi-plus text-lg mb-2 text-gray-600 dark:text-gray-400"></i>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >Create Contract</span
            >
          </button>
          <button
            class="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
          >
            <i class="pi pi-hand-holding-usd text-lg mb-2 text-gray-600 dark:text-gray-400"></i>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Make Offer</span>
          </button>
          <button
            class="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
          >
            <i class="pi pi-search text-lg mb-2 text-gray-600 dark:text-gray-400"></i>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Browse Offers</span>
          </button>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div class="space-y-4">
          <div class="flex items-center space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div class="flex-shrink-0">
              <i class="pi pi-info-circle text-blue-500"></i>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
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
  import { ref, onMounted } from 'vue'
  import { useUserStore } from '@/entities/user/store/userStore'
  import PageFooter from '@/components/PageFooter.vue'

  const userStore = ref<ReturnType<typeof useUserStore> | null>(null)
  const userBalance = ref(0)

  onMounted(async () => {
    try {
      userStore.value = useUserStore()
      // Simulate user balance for demo
      userBalance.value = 100.5
    } catch (error) {
      console.error('Failed to initialize dashboard:', error)
    }
  })
</script>
