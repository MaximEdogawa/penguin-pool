<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Welcome to Penguin Pool</h1>
      <p class="text-gray-600 dark:text-gray-300 mt-2">
        Your decentralized lending platform on the Chia Network
      </p>
    </div>

    <div class="dashboard-content">
      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-wallet text-2xl text-primary-600"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-title">Wallet Balance</h3>
            <p class="stat-value">{{ userBalance }} XCH</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-chart-line text-2xl text-success-600"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-title">Active Loans</h3>
            <p class="stat-value">0</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-file text-2xl text-warning-600"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-title">Contracts</h3>
            <p class="stat-value">0</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-coins text-2xl text-accent-600"></i>
          </div>
          <div class="stat-content">
            <h3 class="stat-title">Piggy Bank</h3>
            <p class="stat-value">0 coins</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div class="actions-grid">
          <button class="action-btn primary">
            <i class="pi pi-plus text-lg"></i>
            <span>Create Contract</span>
          </button>
          <button class="action-btn secondary">
            <i class="pi pi-hand-holding-usd text-lg"></i>
            <span>Make Offer</span>
          </button>
          <button class="action-btn secondary">
            <i class="pi pi-search text-lg"></i>
            <span>Browse Offers</span>
          </button>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="recent-activity">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div class="activity-list">
          <div class="activity-item">
            <div class="activity-icon">
              <i class="pi pi-info-circle text-blue-500"></i>
            </div>
            <div class="activity-content">
              <p class="activity-text">Welcome to Penguin Pool!</p>
              <p class="activity-time">Just now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useUserStore } from '@/entities/user/store/userStore'

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

<style scoped>
  .dashboard-page {
    @apply max-w-7xl mx-auto;
    background-color: var(--surface-ground);
    min-height: 100vh;
  }

  .dashboard-header {
    @apply mb-8 text-center;
  }

  .dashboard-content {
    @apply space-y-8;
  }

  .stats-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
  }

  .stat-card {
    @apply card p-6 flex items-center space-x-4;
  }

  .stat-icon {
    @apply flex-shrink-0;
  }

  .stat-content {
    @apply flex-1;
  }

  .stat-title {
    @apply text-sm font-medium text-gray-600 dark:text-gray-400;
  }

  .stat-value {
    @apply text-2xl font-bold text-gray-900 dark:text-white;
  }

  .quick-actions {
    @apply card p-6;
  }

  .actions-grid {
    @apply grid grid-cols-1 sm:grid-cols-3 gap-4;
  }

  .action-btn {
    @apply flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 transition-colors duration-200;
  }

  .action-btn.primary {
    @apply border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20;
  }

  .action-btn.secondary {
    @apply border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50;
  }

  .action-btn:hover {
    @apply border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20;
  }

  .action-btn i {
    @apply mb-2 text-gray-600 dark:text-gray-400;
  }

  .action-btn span {
    @apply text-sm font-medium text-gray-700 dark:text-gray-300;
  }

  .recent-activity {
    @apply card p-6;
  }

  .activity-list {
    @apply space-y-4;
  }

  .activity-item {
    @apply flex items-center space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50;
  }

  .activity-icon {
    @apply flex-shrink-0;
  }

  .activity-content {
    @apply flex-1;
  }

  .activity-text {
    @apply text-sm font-medium text-gray-900 dark:text-white;
  }

  .activity-time {
    @apply text-xs text-gray-500 dark:text-gray-400;
  }
</style>
