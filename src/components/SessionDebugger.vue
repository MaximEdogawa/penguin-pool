<template>
  <div class="session-debugger">
    <h4>🔍 Session Debugger</h4>

    <div class="debug-section">
      <h5>LocalStorage Check:</h5>
      <div class="info-item">
        <span class="label">Has Persisted Session:</span>
        <span class="value">{{ hasPersistedSession ? 'Yes' : 'No' }}</span>
      </div>

      <div v-if="hasPersistedSession" class="info-item">
        <span class="label">Session Topic:</span>
        <span class="value">{{ persistedSessionTopic }}</span>
      </div>

      <div v-if="hasPersistedSession" class="info-item">
        <span class="label">Session Valid:</span>
        <span :class="['value', persistedSessionValid ? 'valid' : 'invalid']">
          {{ persistedSessionValid ? 'Yes' : 'No' }}
        </span>
      </div>
    </div>

    <div class="debug-section">
      <h5>Current State:</h5>
      <div class="info-item">
        <span class="label">Connected:</span>
        <span :class="['value', isConnected ? 'connected' : 'disconnected']">
          {{ isConnected ? 'Yes' : 'No' }}
        </span>
      </div>

      <div class="info-item">
        <span class="label">Has Session:</span>
        <span :class="['value', hasCurrentSession ? 'yes' : 'no']">
          {{ hasCurrentSession ? 'Yes' : 'No' }}
        </span>
      </div>

      <div v-if="hasCurrentSession" class="info-item">
        <span class="label">Current Topic:</span>
        <span class="value">{{ currentSessionTopic }}</span>
      </div>
    </div>

    <div class="actions">
      <button @click="refreshDebugInfo" class="debug-button">🔄 Refresh</button>

      <button @click="clearPersistedSession" class="debug-button">🗑️ Clear Persisted</button>

      <button @click="testSessionRestore" class="debug-button">🔧 Test Restore</button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useWalletConnectService } from '@/features/walletConnect/services/WalletConnectService'
  import { computed, onMounted, ref } from 'vue'

  const walletService = useWalletConnectService()

  interface DebugInfo {
    timestamp?: number
    refreshCount?: number
  }

  const debugInfo = ref<DebugInfo>({})

  const hasPersistedSession = computed(() => {
    try {
      const persisted = localStorage.getItem('walletconnect-session')
      return !!persisted
    } catch {
      return false
    }
  })

  const persistedSessionTopic = computed(() => {
    try {
      const persisted = localStorage.getItem('walletconnect-session')
      if (persisted) {
        const sessionData = JSON.parse(persisted)
        return sessionData.topic || 'Unknown'
      }
      return 'None'
    } catch {
      return 'Error'
    }
  })

  const persistedSessionValid = computed(() => {
    try {
      const persisted = localStorage.getItem('walletconnect-session')
      if (persisted) {
        const sessionData = JSON.parse(persisted)
        return !!(sessionData.topic && sessionData.namespaces && sessionData.namespaces.chia)
      }
      return false
    } catch {
      return false
    }
  })

  const isConnected = computed(() => walletService.isConnected.value)
  const hasCurrentSession = computed(() => !!walletService.session.value)
  const currentSessionTopic = computed(() => walletService.session.value?.topic || 'None')

  const refreshDebugInfo = () => {
    console.log('🔍 Refreshing session debug info...')
    // Force reactivity update
    debugInfo.value = { ...debugInfo.value }
  }

  const clearPersistedSession = () => {
    try {
      localStorage.removeItem('walletconnect-session')
      console.log('🗑️ Cleared persisted session from localStorage')
      refreshDebugInfo()
    } catch (error) {
      console.error('❌ Failed to clear persisted session:', error)
    }
  }

  const testSessionRestore = async () => {
    console.log('🔧 Testing session restore...')
    try {
      await walletService.restoreSessions()
      console.log('✅ Session restore test completed')
    } catch (error) {
      console.error('❌ Session restore test failed:', error)
    }
  }

  onMounted(() => {
    refreshDebugInfo()
  })
</script>

<style scoped>
  .session-debugger {
    @apply p-4 bg-gray-100 border border-gray-300 rounded-lg text-sm;
  }

  .debug-section {
    @apply mb-4;
  }

  .debug-section h5 {
    @apply font-semibold text-gray-700 mb-2;
  }

  .info-item {
    @apply flex justify-between items-center py-1;
  }

  .label {
    @apply font-medium text-gray-600;
  }

  .value {
    @apply font-mono text-xs;
  }

  .value.valid,
  .value.yes,
  .value.connected {
    @apply text-green-600;
  }

  .value.invalid,
  .value.no,
  .value.disconnected {
    @apply text-red-600;
  }

  .actions {
    @apply flex flex-wrap gap-2;
  }

  .debug-button {
    @apply px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium;
    @apply hover:bg-blue-700;
  }
</style>
