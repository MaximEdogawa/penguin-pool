<template>
  <div class="login-page">
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
                <i class="pi pi-wallet text-xl sm:text-2xl"></i>
              </div>
              <div class="wallet-info">
                <h3 class="wallet-name">Wallet Connect</h3>
                <p class="wallet-description">Connect any compatible wallet</p>
              </div>
              <div class="wallet-status">
                <i v-if="isConnecting" class="pi pi-spin pi-spinner text-base sm:text-lg"></i>
                <i v-else class="pi pi-arrow-right text-base sm:text-lg"></i>
              </div>
            </button>

            <!-- Sage Wallet Option -->
            <button
              @click="connectSageWallet"
              class="wallet-option secondary"
              :disabled="isConnecting"
            >
              <div class="wallet-icon">
                <i class="pi pi-credit-card text-xl sm:text-2xl"></i>
              </div>
              <div class="wallet-info">
                <h3 class="wallet-name">Sage Wallet</h3>
                <p class="wallet-description">Native Chia wallet integration</p>
              </div>
              <div class="wallet-status">
                <i v-if="isConnecting" class="pi pi-spin pi-spinner text-base sm:text-lg"></i>
                <i v-else class="pi pi-arrow-right text-base sm:text-lg"></i>
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

    <!-- Wallet Connect Modal -->
    <WalletConnectModal
      :is-open="showWalletModal"
      @close="closeWalletModal"
      @connected="handleWalletConnected"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/entities/user/store/userStore'
  import { useWalletConnectStore } from '@/features/walletConnect/stores/walletConnectStore'
  import WalletConnectModal from '@/features/walletConnect/components/WalletConnectModal.vue'
  import PenguinLogo from '@/components/PenguinLogo.vue'

  const router = useRouter()
  const userStore = useUserStore()
  const walletConnectStore = useWalletConnectStore()

  // State
  const showWalletModal = ref(false)
  const connectionStatus = ref('')
  const statusType = ref<'info' | 'success' | 'error'>('info')
  const statusIcon = ref('pi pi-info-circle')

  // Computed
  const isConnecting = computed(() => walletConnectStore.isConnecting)

  // Methods
  const connectWalletConnect = async () => {
    showWalletModal.value = true
  }

  const connectSageWallet = async () => {
    try {
      connectionStatus.value = 'Opening Sage Wallet...'
      statusType.value = 'info'
      statusIcon.value = 'pi pi-spin pi-spinner'

      // For now, redirect to Sage Wallet or show instructions
      // This would be implemented based on Sage Wallet's deep linking
      window.open('sage://wallet', '_blank')

      connectionStatus.value = 'Please complete connection in Sage Wallet'
      statusType.value = 'info'
      statusIcon.value = 'pi pi-info-circle'
    } catch (error) {
      console.error('Sage Wallet connection failed:', error)
      connectionStatus.value = 'Sage Wallet connection failed'
      statusType.value = 'error'
      statusIcon.value = 'pi pi-exclamation-triangle'
    }
  }

  const handleWalletConnected = async (session: unknown) => {
    console.log('Wallet connected:', session)

    try {
      // Verify session is valid
      if (
        !session ||
        typeof session !== 'object' ||
        !('accounts' in session) ||
        !Array.isArray((session as { accounts: unknown }).accounts) ||
        (session as { accounts: unknown[] }).accounts.length === 0
      ) {
        throw new Error('Invalid wallet session - no accounts found')
      }

      connectionStatus.value = 'Wallet connected successfully!'
      statusType.value = 'success'
      statusIcon.value = 'pi pi-check-circle'

      // Get wallet info and login user
      const walletInfo = await walletConnectStore.getWalletInfo()
      if (walletInfo && walletInfo.address) {
        console.log('Logging in with wallet address:', walletInfo.address)
        await userStore.login(walletInfo.address, 'wallet-user')
      } else {
        // Fallback: use first account from session
        const sessionObj = session as { accounts: string[] }
        const address = sessionObj.accounts[0]
        console.log('Using fallback address from session:', address)
        await userStore.login(address, 'wallet-user')
      }

      // Redirect to dashboard after successful connection
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (error) {
      console.error('Failed to process wallet connection:', error)
      connectionStatus.value =
        'Failed to process wallet connection: ' +
        (error instanceof Error ? error.message : 'Unknown error')
      statusType.value = 'error'
      statusIcon.value = 'pi pi-exclamation-triangle'
    } finally {
      showWalletModal.value = false
    }
  }

  const closeWalletModal = () => {
    showWalletModal.value = false
  }

  // Initialize Wallet Connect on mount
  onMounted(async () => {
    try {
      await walletConnectStore.initialize()

      // Check if already connected and redirect if so
      if (walletConnectStore.isConnected) {
        const walletInfo = await walletConnectStore.getWalletInfo()
        if (walletInfo) {
          await userStore.login(walletInfo.address, 'wallet-user')
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Failed to initialize Wallet Connect:', error)
      // Don't show error to user, just log it
      // Wallet Connect will show appropriate error when user tries to connect
    }
  })
</script>

<style scoped>
  .login-page {
    @apply min-h-screen w-full mt-10 sm:mt-10 md:mt-10 lg:mt-1 xl:mt-1;
    background-color: var(--surface-ground);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .auth-container {
    @apply min-h-screen flex items-center justify-center p-4 sm:p-6;
    flex: 1;
  }

  .auth-card {
    @apply bg-white dark:bg-gray-800 rounded-2xl shadow-strong border border-gray-200 dark:border-gray-700;
    max-width: 480px;
    width: 100%;
  }

  .auth-header {
    @apply p-6 sm:p-8 text-center border-b border-gray-200 dark:border-gray-700;
  }

  .logo-container {
    @apply mb-4 sm:mb-6;
  }

  .logo {
    @apply w-12 h-12 sm:w-16 sm:h-16 mx-auto;
  }

  .auth-title {
    @apply text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2;
  }

  .auth-subtitle {
    @apply text-sm sm:text-base text-gray-600 dark:text-gray-400;
  }

  .wallet-section {
    @apply p-6 sm:p-8;
  }

  .section-title {
    @apply text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2;
  }

  .section-description {
    @apply text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6;
  }

  .wallet-options {
    @apply space-y-3 sm:space-y-4 mb-4 sm:mb-6;
  }

  .wallet-option {
    @apply w-full flex items-center p-3 sm:p-4 rounded-xl border-2 border-transparent transition-all duration-200;
  }

  .wallet-option.primary {
    @apply bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30;
  }

  .wallet-option.secondary {
    @apply bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/70;
  }

  .wallet-option:disabled {
    @apply opacity-50 cursor-not-allowed;
  }

  .wallet-icon {
    @apply w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 mr-3 sm:mr-4;
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
    @apply flex items-center p-3 rounded-lg text-sm mb-4 sm:mb-6;
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
    @apply mb-4 sm:mb-6;
  }

  .help-title {
    @apply text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3;
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
    @apply p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700;
  }

  .footer-text {
    @apply text-xs text-gray-500 dark:text-gray-400 text-center;
  }

  .footer-link {
    @apply text-primary-600 dark:text-primary-400 hover:underline;
  }
</style>
