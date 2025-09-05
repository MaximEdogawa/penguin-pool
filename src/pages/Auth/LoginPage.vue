<template>
  <div
    class="login-page min-h-screen flex items-center justify-center px-6 py-20 md:px-20 lg:px-80 backdrop-blur-3xl bg-cover bg-center bg-no-repeat"
    :style="backgroundStyle"
  >
    <div
      class="px-8 md:px-12 lg:px-20 flex py-4 flex-col items-center gap-2 w-full backdrop-blur-2xl rounded-2xl bg-white/10 dark:bg-gray-800/10 border border-white/10 dark:border-gray-700/10 max-w-md"
    >
      <!-- Logo and Title -->
      <div class="flex flex-col items-center gap-2 w-full">
        <div class="logo-container">
          <PenguinLogo class="h-12 w-12" />
        </div>
        <div class="flex flex-col gap-2 w-full">
          <div class="text-center text-2xl font-medium text-white dark:text-gray-100 leading-tight">
            Penguin Pool
          </div>
          <div class="text-center text-sm">
            <span class="text-white/80 dark:text-gray-300/80"
              >Connect your wallet to access the decentralized lending platform</span
            >
          </div>
        </div>
      </div>

      <!-- Wallet Connection Section -->
      <div class="flex flex-col items-center w-full">
        <div class="flex flex-col w-full">
          <!-- Primary Wallet Option - Sage -->
          <button
            @click="connectWalletConnect"
            class="wallet-option-primary group relative overflow-hidden rounded-3xl bg-white/10 dark:bg-gray-800/10 border border-white/20 dark:border-gray-700/20 p-6 w-full transition-all duration-300 hover:bg-white/20 dark:hover:bg-gray-800/20 hover:scale-105 hover:shadow-xl"
            :disabled="isConnecting"
          >
            <div class="flex items-center gap-2">
              <div class="wallet-icon-primary">
                <i class="pi pi-wallet text-2xl text-white dark:text-gray-100"></i>
              </div>
              <div class="flex-1 text-left">
                <h3 class="text-lg font-semibold text-white dark:text-gray-100 mb-1">
                  Sage Wallet
                </h3>
                <p class="text-sm text-white/70 dark:text-gray-300/70">
                  Recommended for Chia Network
                </p>
              </div>
              <div class="wallet-status">
                <i v-if="isConnecting" class="pi pi-spin pi-spinner text-lg text-white/70"></i>
                <i
                  v-else
                  class="pi pi-arrow-right text-lg text-white/70 group-hover:text-white transition-colors"
                ></i>
              </div>
            </div>
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
            ></div>
          </button>

          <!-- Secondary Wallet Options -->
          <div class="flex flex-col gap-2 mt-4">
            <div class="text-center text-sm text-white/60 dark:text-gray-400 mb-2">
              Other Wallets
            </div>

            <!-- Chia Wallet -->
            <button
              @click="connectChiaWallet"
              class="wallet-option-secondary group relative overflow-hidden rounded-2xl bg-white/5 dark:bg-gray-800/5 border border-white/10 dark:border-gray-700/10 p-4 w-full transition-all duration-300 hover:bg-white/10 dark:hover:bg-gray-800/10"
              :disabled="isConnecting"
            >
              <div class="flex items-center gap-3">
                <div class="wallet-icon-secondary">
                  <i class="pi pi-wallet text-lg text-white/60 dark:text-gray-400"></i>
                </div>
                <div class="flex-1 text-left">
                  <h4 class="text-sm font-medium text-white/80 dark:text-gray-200">Chia Wallet</h4>
                  <p class="text-xs text-white/50 dark:text-gray-400">Official Chia wallet</p>
                </div>
                <i
                  class="pi pi-arrow-right text-sm text-white/40 group-hover:text-white/60 transition-colors"
                ></i>
              </div>
            </button>

            <!-- Other Wallets -->
            <button
              @click="connectOtherWallet"
              class="wallet-option-secondary group relative overflow-hidden rounded-2xl bg-white/5 dark:bg-gray-800/5 border border-white/10 dark:border-gray-700/10 p-4 w-full transition-all duration-300 hover:bg-white/10 dark:hover:bg-gray-800/10"
              :disabled="isConnecting"
            >
              <div class="flex items-center gap-3">
                <div class="wallet-icon-secondary">
                  <i class="pi pi-wallet text-lg text-white/60 dark:text-gray-400"></i>
                </div>
                <div class="flex-1 text-left">
                  <h4 class="text-sm font-medium text-white/80 dark:text-gray-200">
                    Other Wallets
                  </h4>
                  <p class="text-xs text-white/50 dark:text-gray-400">WalletConnect compatible</p>
                </div>
                <i
                  class="pi pi-arrow-right text-sm text-white/40 group-hover:text-white/60 transition-colors"
                ></i>
              </div>
            </button>
          </div>
        </div>

        <!-- Connection Status -->
        <div v-if="connectionStatus" class="connection-status w-full" :class="statusType">
          <i :class="statusIcon" class="status-icon"></i>
          <span class="status-text">{{ connectionStatus }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center">
        <p class="text-white/60 dark:text-gray-400 text-sm">
          By connecting your wallet, you agree to our
          <a
            href="#"
            class="text-white/80 dark:text-gray-300 hover:text-white dark:hover:text-gray-100 underline transition-colors"
            >Terms of Service</a
          >
          and
          <a
            href="#"
            class="text-white/80 dark:text-gray-300 hover:text-white dark:hover:text-gray-100 underline transition-colors"
            >Privacy Policy</a
          >
        </p>
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
    backgroundImage:
      "url('https://fqjltiegiezfetthbags.supabase.co/storage/v1/object/public/block.images/blocks/signin/signin-glass.jpg')",
  }))

  // Methods
  const connectWalletConnect = async () => {
    showWalletModal.value = true
  }

  const connectChiaWallet = async () => {
    showWalletModal.value = true
  }

  const connectOtherWallet = async () => {
    showWalletModal.value = true
  }

  const handleWalletConnected = async (walletInfo: unknown) => {
    console.log('Wallet connected:', walletInfo)

    try {
      // Verify wallet info is valid
      if (!walletInfo || typeof walletInfo !== 'object') {
        throw new Error('Invalid wallet info - no wallet data received')
      }

      const wallet = walletInfo as { address: string }
      if (!wallet.address) {
        throw new Error('Invalid wallet info - no address found')
      }

      connectionStatus.value = 'Wallet connected successfully!'
      statusType.value = 'success'
      statusIcon.value = 'pi pi-check-circle'

      // Login user with wallet address
      console.log('Logging in with wallet address:', wallet.address)
      await userStore.login(wallet.address, 'wallet-user')

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

  onMounted(async () => {
    try {
      await walletConnectStore.initialize()

      if (walletConnectStore.isConnected) {
        const walletInfo = await walletConnectStore.getWalletInfo()
        if (walletInfo) {
          await userStore.login(walletInfo.fingerprint.toString(), 'wallet-user')
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Failed to initialize Wallet Connect:', error)
    }
  })
</script>

<style scoped>
  .login-page {
    min-height: 100vh;
    position: relative;
  }

  .wallet-option-primary {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .wallet-option-primary:disabled {
    @apply opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-none;
  }

  .wallet-option-secondary {
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }

  .wallet-option-secondary:disabled {
    @apply opacity-50 cursor-not-allowed;
  }

  .wallet-icon-primary {
    @apply w-12 h-12 bg-white/20 dark:bg-gray-800/20 rounded-xl flex items-center justify-center backdrop-blur-sm;
  }

  .wallet-icon-secondary {
    @apply w-8 h-8 bg-white/10 dark:bg-gray-800/10 rounded-lg flex items-center justify-center backdrop-blur-sm;
  }

  .connection-status {
    @apply p-4 rounded-2xl text-sm font-medium flex items-center gap-3 backdrop-blur-sm;
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
