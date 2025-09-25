<template>
  <div class="ios-debug-container">
    <h3>🍎 iOS WalletConnect Debug</h3>

    <div class="debug-info">
      <div class="info-item">
        <span class="label">Platform:</span>
        <span class="value">{{ isIOSDevice ? 'iOS' : 'Non-iOS' }}</span>
      </div>

      <div class="info-item">
        <span class="label">Service Used:</span>
        <span class="value">{{ isIOSDevice ? 'iOS Service' : 'Standard Service' }}</span>
      </div>

      <div class="info-item">
        <span class="label">Connection Status:</span>
        <span :class="['value', connectionStatus]">{{ connectionStatus }}</span>
      </div>

      <div v-if="isIOSDevice" class="info-item">
        <span class="label">WebSocket Status:</span>
        <span :class="['value', websocketStatus]">{{ websocketStatus }}</span>
      </div>

      <div v-if="isIOSDevice && connectionAttempts > 0" class="info-item">
        <span class="label">Connection Attempts:</span>
        <span class="value">{{ connectionAttempts }}/5</span>
      </div>

      <div v-if="isIOSDevice && isHealing" class="info-item">
        <span class="label">Healing:</span>
        <span class="value healing">🔄 In Progress</span>
      </div>
    </div>

    <div class="actions">
      <button @click="testRestoreSessions" :disabled="isConnecting" class="test-button">
        Test Session Restore
      </button>

      <button
        v-if="isIOSDevice && isConnected"
        @click="testHealConnection"
        :disabled="isHealing"
        class="test-button"
      >
        Test Connection Healing
      </button>

      <button @click="refreshDebugInfo" class="test-button">Refresh Debug Info</button>
    </div>

    <div v-if="debugLogs.length > 0" class="debug-logs">
      <h4>Debug Logs:</h4>
      <div class="log-container">
        <div v-for="(log, index) in debugLogs" :key="index" class="log-entry">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useWalletConnectService } from '@/features/walletConnect/services/WalletConnectService'
  import { computed, onMounted, ref } from 'vue'

  const walletService = useWalletConnectService()
  const debugLogs = ref<string[]>([])

  const isIOSDevice = computed(() => walletService.isIOS.value)
  const isConnected = computed(() => walletService.isConnected.value)
  const isConnecting = computed(() => walletService.isConnecting.value)
  const connectionStatus = computed(() => {
    if (isConnecting.value) return 'connecting'
    if (isConnected.value) return 'connected'
    return 'disconnected'
  })

  // iOS-specific properties
  const websocketStatus = computed(() => {
    if (!isIOSDevice.value) return 'n/a'
    const iosStatus = walletService.getIOSConnectionStatus()
    return iosStatus?.websocketStatus || 'unknown'
  })

  const connectionAttempts = computed(() => {
    if (!isIOSDevice.value) return 0
    const iosStatus = walletService.getIOSConnectionStatus()
    return iosStatus?.connectionAttempts || 0
  })

  const isHealing = computed(() => {
    if (!isIOSDevice.value) return false
    const iosStatus = walletService.getIOSConnectionStatus()
    return iosStatus?.isHealing || false
  })

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    debugLogs.value.unshift(`[${timestamp}] ${message}`)
    if (debugLogs.value.length > 20) {
      debugLogs.value = debugLogs.value.slice(0, 20)
    }
  }

  const testRestoreSessions = async () => {
    addLog('Testing session restoration...')
    try {
      await walletService.restoreSessions()
      addLog('Session restoration completed')
    } catch (error) {
      addLog(`Session restoration failed: ${error}`)
    }
  }

  const testHealConnection = async () => {
    if (!isIOSDevice.value) return

    addLog('Testing connection healing...')
    try {
      await walletService.healConnection()
      addLog('Connection healing completed')
    } catch (error) {
      addLog(`Connection healing failed: ${error}`)
    }
  }

  const refreshDebugInfo = () => {
    addLog('Debug info refreshed')
  }

  onMounted(() => {
    addLog('iOS WalletConnect Debug component mounted')
    addLog(`Platform: ${isIOSDevice.value ? 'iOS' : 'Non-iOS'}`)
    addLog(`Service: ${isIOSDevice.value ? 'iOS Service' : 'Standard Service'}`)
  })
</script>

<style scoped>
  .ios-debug-container {
    @apply p-4 bg-gray-50 border border-gray-200 rounded-lg;
  }

  .debug-info {
    @apply space-y-2 mb-4;
  }

  .info-item {
    @apply flex justify-between items-center py-1;
  }

  .label {
    @apply font-medium text-gray-600;
  }

  .value {
    @apply font-mono text-sm;
  }

  .value.connected {
    @apply text-green-600;
  }

  .value.connecting {
    @apply text-blue-600;
  }

  .value.disconnected {
    @apply text-gray-600;
  }

  .value.healing {
    @apply text-yellow-600;
  }

  .actions {
    @apply flex flex-wrap gap-2 mb-4;
  }

  .test-button {
    @apply px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium;
    @apply hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .debug-logs {
    @apply mt-4;
  }

  .log-container {
    @apply max-h-40 overflow-y-auto bg-black text-green-400 p-2 rounded text-xs font-mono;
  }

  .log-entry {
    @apply mb-1;
  }
</style>
