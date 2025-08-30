<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- Logo and Title -->
      <div class="auth-header">
        <div class="logo-container">
          <PenguinLogo class="logo" />
        </div>
        <h1 class="auth-title">Welcome to Penguin Pool</h1>
        <p class="auth-subtitle">
          Connect your wallet to access the decentralized lending platform
        </p>
      </div>

      <!-- Wallet Connection Section -->
      <div class="wallet-section">
        <h2 class="section-title">Connect Your Wallet</h2>
        <p class="section-description">
          Choose your preferred wallet to securely connect to the Chia Network
        </p>

        <!-- Wallet Options -->
        <div class="wallet-options">
          <!-- Wallet Connect Option -->
          <button
            @click="connectWalletConnect"
            class="wallet-option primary"
            :disabled="isConnecting"
          >
            <div class="wallet-icon">
              <i class="pi pi-wallet text-2xl"></i>
            </div>
            <div class="wallet-info">
              <h3 class="wallet-name">Wallet Connect</h3>
              <p class="wallet-description">Connect any compatible wallet</p>
            </div>
            <div class="wallet-status">
              <i v-if="isConnecting" class="pi pi-spin pi-spinner text-lg"></i>
              <i v-else class="pi pi-arrow-right text-lg"></i>
            </div>
          </button>

          <!-- Sage Wallet Option -->
          <button
            @click="connectSageWallet"
            class="wallet-option secondary"
            :disabled="isConnecting"
          >
            <div class="wallet-icon">
              <i class="pi pi-credit-card text-2xl"></i>
            </div>
            <div class="wallet-info">
              <h3 class="wallet-name">Sage Wallet</h3>
              <p class="wallet-description">Native Chia wallet integration</p>
            </div>
            <div class="wallet-status">
              <i v-if="isConnecting" class="pi pi-spin pi-spinner text-lg"></i>
              <i v-else class="pi pi-arrow-right text-lg"></i>
            </div>
          </button>
        </div>

        <!-- Connection Status -->
        <div v-if="connectionStatus" class="connection-status" :class="statusType">
          <i :class="statusIcon" class="status-icon"></i>
          <span class="status-text">{{ connectionStatus }}</span>
        </div>

        <!-- Help Section -->
        <div class="help-section">
          <h3 class="help-title">Need Help?</h3>
          <div class="help-links">
            <a href="#" class="help-link">
              <i class="pi pi-question-circle text-sm"></i>
              <span>How to connect wallet</span>
            </a>
            <a href="#" class="help-link">
              <i class="pi pi-shield text-sm"></i>
              <span>Security guide</span>
            </a>
            <a href="#" class="help-link">
              <i class="pi pi-book text-sm"></i>
              <span>Documentation</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="auth-footer">
        <p class="footer-text">
          By connecting your wallet, you agree to our
          <a href="#" class="footer-link">Terms of Service</a> and
          <a href="#" class="footer-link">Privacy Policy</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/entities/user/store/userStore'
  import PenguinLogo from '@/components/PenguinLogo.vue'

  // Router and stores
  const router = useRouter()
  const userStore = useUserStore()

  // State
  const isConnecting = ref(false)
  const connectionStatus = ref('')
  const statusType = ref<'info' | 'success' | 'error'>('info')

  // Computed
  const statusIcon = computed(() => {
    switch (statusType.value) {
      case 'success':
        return 'pi pi-check-circle'
      case 'error':
        return 'pi pi-exclamation-triangle'
      default:
        return 'pi pi-info-circle'
    }
  })

  // Methods
  const connectWalletConnect = async () => {
    await connectWallet('wallet-connect')
  }

  const connectSageWallet = async () => {
    await connectWallet('sage-wallet')
  }

  const connectWallet = async (walletType: string) => {
    isConnecting.value = true
    connectionStatus.value = `Connecting to ${walletType}...`
    statusType.value = 'info'

    try {
      // Simulate wallet connection (replace with actual implementation)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock wallet address (replace with actual wallet connection)
      const mockWalletAddress = `xch1${Math.random().toString(36).substring(2, 15)}`

      // Login user with wallet
      await userStore.login(mockWalletAddress)

      connectionStatus.value = 'Wallet connected successfully!'
      statusType.value = 'success'

      // Redirect to dashboard after successful connection
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } catch (error) {
      console.error('Wallet connection failed:', error)
      connectionStatus.value = 'Failed to connect wallet. Please try again.'
      statusType.value = 'error'
    } finally {
      isConnecting.value = false
    }
  }
</script>

<style scoped>
  .auth-container {
    @apply min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900;
  }

  .auth-card {
    @apply w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-strong border border-gray-200 dark:border-gray-700 overflow-hidden;
  }

  /* Auth Header */
  .auth-header {
    @apply text-center p-8 border-b border-gray-200 dark:border-gray-700;
  }

  .logo-container {
    @apply mb-6;
  }

  .logo {
    @apply w-16 h-16 mx-auto;
  }

  .auth-title {
    @apply text-2xl font-bold text-gray-900 dark:text-white mb-2;
  }

  .auth-subtitle {
    @apply text-gray-600 dark:text-gray-300 text-sm;
  }

  /* Wallet Section */
  .wallet-section {
    @apply p-8;
  }

  .section-title {
    @apply text-lg font-semibold text-gray-900 dark:text-white mb-2;
  }

  .section-description {
    @apply text-gray-600 dark:text-gray-300 text-sm mb-6;
  }

  .wallet-options {
    @apply space-y-3 mb-6;
  }

  .wallet-option {
    @apply w-full flex items-center p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer;
  }

  .wallet-option.primary {
    @apply border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30;
  }

  .wallet-option.secondary {
    @apply border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50;
  }

  .wallet-option:disabled {
    @apply opacity-50 cursor-not-allowed;
  }

  .wallet-icon {
    @apply w-12 h-12 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 mr-4;
  }

  .wallet-info {
    @apply flex-1 text-left;
  }

  .wallet-name {
    @apply font-semibold text-gray-900 dark:text-white text-sm;
  }

  .wallet-description {
    @apply text-gray-500 dark:text-gray-400 text-xs;
  }

  .wallet-status {
    @apply text-gray-400 dark:text-gray-500;
  }

  /* Connection Status */
  .connection-status {
    @apply flex items-center p-3 rounded-lg text-sm mb-6;
  }

  .connection-status.info {
    @apply bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300;
  }

  .connection-status.success {
    @apply bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300;
  }

  .connection-status.error {
    @apply bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300;
  }

  .status-icon {
    @apply mr-2;
  }

  .status-text {
    @apply font-medium;
  }

  /* Help Section */
  .help-section {
    @apply mb-6;
  }

  .help-title {
    @apply text-sm font-medium text-gray-700 dark:text-gray-300 mb-3;
  }

  .help-links {
    @apply space-y-2;
  }

  .help-link {
    @apply flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200;
  }

  .help-link i {
    @apply mr-2;
  }

  /* Auth Footer */
  .auth-footer {
    @apply p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700;
  }

  .footer-text {
    @apply text-xs text-gray-500 dark:text-gray-400 text-center;
  }

  .footer-link {
    @apply text-primary-600 dark:text-primary-400 hover:underline;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .auth-card {
      @apply mx-4;
    }

    .auth-header {
      @apply p-6;
    }

    .wallet-section {
      @apply p-6;
    }
  }
</style>
