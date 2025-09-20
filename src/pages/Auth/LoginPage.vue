<template>
  <!-- Login Screen with Loading State -->
  <PWAInstallPrompt />
  <div class="login-page" :style="backgroundStyle">
    <div class="login-container">
      <!-- Logo and Title -->
      <div class="logo-section">
        <div class="logo-container">
          <PenguinLogo class="logo-icon" />
        </div>
        <div class="title-section">
          <div class="main-title">Penguin Pool</div>
          <div class="subtitle">
            <span class="subtitle-text"
              >Connect your wallet to access the decentralized lending platform</span
            >
          </div>
        </div>
      </div>

      <!-- Wallet Connection Section -->
      <div class="wallet-section">
        <div class="wallet-options">
          <!-- Primary Wallet Option - Sage -->
          <button
            @click="showWalletModal = true"
            class="wallet-option-primary group"
            :disabled="isConnecting"
          >
            <div class="wallet-button-content">
              <div class="wallet-icon-primary">
                <i class="wallet-icon pi pi-wallet"></i>
              </div>
              <div class="wallet-text-content">
                <h3 class="wallet-title">Sage Wallet</h3>
                <p class="wallet-subtitle">Recommended for Chia Network</p>
              </div>
              <div class="wallet-status">
                <i v-if="isConnecting" class="wallet-spinner pi pi-spin pi-spinner"></i>
                <i v-else class="wallet-arrow pi pi-arrow-right"></i>
              </div>
            </div>
            <div class="wallet-hover-overlay"></div>
          </button>

          <!-- Secondary Wallet Options -->
          <div class="secondary-wallet-options">
            <!-- Other Wallets -->
            <FeatureFlag category="app" feature="otherWallets">
              <button
                @click="showWalletModal = true"
                class="wallet-option-secondary group"
                :disabled="isConnecting"
              >
                <div class="secondary-wallet-content">
                  <div class="secondary-wallet-icon">
                    <i class="secondary-wallet-icon-symbol pi pi-wallet"></i>
                  </div>
                  <div class="secondary-wallet-text">
                    <h4 class="secondary-wallet-title">Other Wallets</h4>
                    <p class="secondary-wallet-subtitle">WalletConnect compatible</p>
                  </div>
                  <i class="secondary-wallet-arrow pi pi-arrow-right"></i>
                </div>
              </button>
            </FeatureFlag>
          </div>
        </div>

        <!-- Connection Status -->
        <div v-if="connectionStatus" class="connection-status" :class="statusType">
          <i :class="statusIcon" class="status-icon"></i>
          <span class="status-text">{{ connectionStatus }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="footer-text">
          By connecting your wallet, you agree to our
          <a href="#" class="footer-link">Terms of Service</a>
          and
          <a href="#" class="footer-link">Privacy Policy</a>
        </p>
      </div>
    </div>

    <!-- Wallet Connect Modal -->
    <WalletConnectModal
      v-if="showWalletModal"
      :is-open="showWalletModal"
      @close="closeWalletModal"
      @connected="handleWalletConnected"
    />
  </div>
</template>

<script setup lang="ts">
  import signinGlassImage from '@/assets/signin-glass.jpg'
  import FeatureFlag from '@/components/FeatureFlag.vue'
  import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue'
  import PenguinLogo from '@/components/PenguinLogo.vue'
  import { useUserStore } from '@/entities/user/store/userStore'
  import WalletConnectModal from '@/features/walletConnect/components/WalletConnectModal.vue'
  import { useWalletConnectStore } from '@/features/walletConnect/stores/walletConnectStore'
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'

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

  const backgroundStyle = computed(() => ({
    backgroundImage: `url('${signinGlassImage}')`,
  }))

  const handleWalletConnected = async (walletInfo: unknown) => {
    try {
      if (!walletInfo || typeof walletInfo !== 'object') {
        throw new Error('Invalid wallet info - no wallet data received')
      }

      const wallet = walletInfo as { address: string; fingerprint?: number }
      if (!wallet.address) {
        throw new Error('Invalid wallet info - no address found')
      }

      if (wallet.fingerprint) {
        await userStore.login(wallet.fingerprint, 'wallet-user')
      } else {
        await userStore.login(wallet.address, 'wallet-user')
      }

      await router.push('/dashboard')
    } catch (error) {
      console.error('Failed to process wallet connection:', error)
      connectionStatus.value =
        'Failed to process wallet connection: ' +
        (error instanceof Error ? error.message : 'Unknown error')
      statusType.value = 'error'
      statusIcon.value = 'pi pi-exclamation-triangle'
    }
  }

  const closeWalletModal = () => {
    showWalletModal.value = false
  }

  onMounted(async () => {
    try {
      if (walletConnectStore.isConnected) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const walletInfo = walletConnectStore.walletInfo
        await handleWalletConnected(walletInfo)
      }
    } catch (error) {
      console.error('Failed to initialize Wallet Connect:', error)
    }
  })
</script>

<style scoped>
  .login-page {
    @apply min-h-screen flex items-center justify-center px-6 py-20 md:px-20 lg:px-80 backdrop-blur-3xl bg-cover bg-center bg-no-repeat;
    position: relative;
  }

  .login-container {
    @apply px-8 md:px-12 lg:px-20 flex py-4 flex-col items-center gap-2 w-full backdrop-blur-2xl rounded-2xl bg-white/10 dark:bg-gray-800/10 border border-white/10 dark:border-gray-700/10 max-w-md;
  }

  .logo-section {
    @apply flex flex-col items-center gap-2 w-full;
  }

  .logo-icon {
    @apply h-12 w-12;
  }

  .title-section {
    @apply flex flex-col gap-2 w-full;
  }

  .main-title {
    @apply text-center text-2xl font-medium text-white dark:text-gray-100 leading-tight;
  }

  .subtitle {
    @apply text-center text-sm;
  }

  .subtitle-text {
    @apply text-white/80 dark:text-gray-300/80;
  }

  .wallet-section {
    @apply flex flex-col items-center w-full;
  }

  .wallet-options {
    @apply flex flex-col w-full;
  }

  .wallet-option-primary {
    @apply relative overflow-hidden rounded-3xl bg-white/10 dark:bg-gray-800/10 border border-white/20 dark:border-gray-700/20 p-6 w-full transition-all duration-300 hover:bg-white/20 dark:hover:bg-gray-800/20 hover:scale-105 hover:shadow-xl;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .wallet-option-primary:disabled {
    @apply opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none;
  }

  .wallet-button-content {
    @apply flex items-center gap-2;
  }

  .wallet-icon-primary {
    @apply w-12 h-12 bg-white/20 dark:bg-gray-800/20 rounded-xl flex items-center justify-center backdrop-blur-sm;
  }

  .wallet-icon {
    @apply text-2xl text-white dark:text-gray-100;
  }

  .wallet-text-content {
    @apply flex-1 text-left;
  }

  .wallet-title {
    @apply text-lg font-semibold text-white dark:text-gray-100 mb-1;
  }

  .wallet-subtitle {
    @apply text-sm text-white/70 dark:text-gray-300/70;
  }

  .wallet-spinner {
    @apply text-lg text-white/70;
  }

  .wallet-arrow {
    @apply text-lg text-white/70 group-hover:text-white transition-colors;
  }

  .wallet-hover-overlay {
    @apply absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl;
  }

  .secondary-wallet-options {
    @apply flex flex-col gap-2 mt-4;
  }

  .wallet-option-secondary {
    @apply relative overflow-hidden rounded-2xl bg-white/5 dark:bg-gray-800/5 border border-white/10 dark:border-gray-700/10 p-4 w-full transition-all duration-300 hover:bg-white/10 dark:hover:bg-gray-800/10;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }

  .wallet-option-secondary:disabled {
    @apply opacity-50 cursor-not-allowed;
  }

  .secondary-wallet-content {
    @apply flex items-center gap-3;
  }

  .secondary-wallet-icon {
    @apply w-8 h-8 bg-white/10 dark:bg-gray-800/10 rounded-lg flex items-center justify-center backdrop-blur-sm;
  }

  .secondary-wallet-icon-symbol {
    @apply text-lg text-white/60 dark:text-gray-400;
  }

  .secondary-wallet-text {
    @apply flex-1 text-left;
  }

  .secondary-wallet-title {
    @apply text-sm font-medium text-white/80 dark:text-gray-200;
  }

  .secondary-wallet-subtitle {
    @apply text-xs text-white/50 dark:text-gray-400;
  }

  .secondary-wallet-arrow {
    @apply text-sm text-white/40 group-hover:text-white/60 transition-colors;
  }

  .connection-status {
    @apply p-4 rounded-2xl text-sm font-medium flex items-center gap-3 backdrop-blur-sm w-full;
  }

  .connection-status.info {
    @apply bg-blue-500/20 dark:bg-blue-500/10 text-blue-200 dark:text-blue-300 border border-blue-400/30 dark:border-blue-500/20;
  }

  .connection-status.success {
    @apply bg-green-500/20 dark:bg-green-500/10 text-green-200 dark:text-green-300 border border-green-400/30 dark:border-green-500/20;
  }

  .connection-status.error {
    @apply bg-red-500/20 dark:bg-red-500/10 text-red-200 dark:text-red-300 border border-red-400/30 dark:border-red-500/20;
  }

  .status-icon {
    @apply text-lg;
  }

  .footer {
    @apply text-center;
  }

  .footer-text {
    @apply text-white/60 dark:text-gray-400 text-sm;
  }

  .footer-link {
    @apply text-white/80 dark:text-gray-300 hover:text-white dark:hover:text-gray-100 underline transition-colors;
  }

  /* Glass morphism effects */
  .login-page::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
    pointer-events: none;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .login-page {
      @apply px-4 py-16;
    }
  }

  @media (max-width: 480px) {
    .login-page {
      @apply px-3 py-12;
    }
  }
</style>
