<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-2 sm:p-4">
    <div class="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Service Health Monitor
            </h1>
            <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Monitor the health and status of backend services and database connections
            </p>
          </div>
          <div class="mt-4 sm:mt-0 flex items-center space-x-2">
            <label class="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <input
                v-model="autoRefresh"
                type="checkbox"
                class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Auto-refresh
            </label>
            <span class="text-xs text-gray-500">{{ autoRefreshInterval }}s</span>
          </div>
        </div>
      </div>

      <!-- Connection Controls -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
        <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Connection Controls
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            @click="connectWebSocket"
            :disabled="wsConnected || wsConnecting"
            class="w-full px-3 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <div class="flex items-center justify-center space-x-2">
              <div
                class="w-2 h-2 rounded-full"
                :class="wsConnected ? 'bg-green-400' : 'bg-gray-400'"
              ></div>
              <span>{{
                wsConnecting ? 'Connecting...' : wsConnected ? 'Connected' : 'Connect WebSocket'
              }}</span>
            </div>
          </button>
          <button
            @click="disconnectWebSocket"
            :disabled="!wsConnected"
            class="w-full px-3 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Disconnect WebSocket
          </button>
          <button
            @click="checkAllServices"
            :disabled="isCheckingAll"
            class="w-full px-3 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <div class="flex items-center justify-center space-x-2">
              <svg v-if="isCheckingAll" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                  fill="none"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>{{ isCheckingAll ? 'Checking...' : 'Check All Services' }}</span>
            </div>
          </button>
          <button
            @click="clearAllData"
            class="w-full px-3 py-2 text-sm sm:text-base bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear All Data
          </button>
        </div>
      </div>

      <!-- Status Overview -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <!-- WebSocket Status -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <div
                class="w-3 h-3 rounded-full"
                :class="wsConnected ? 'bg-green-500' : 'bg-red-500'"
              ></div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">WebSocket</p>
            </div>
            <div class="text-xs text-gray-500">{{ wsUptime }}</div>
          </div>
          <p
            class="text-xl sm:text-2xl font-bold"
            :class="wsConnected ? 'text-green-600' : 'text-red-600'"
          >
            {{ wsConnected ? 'Connected' : 'Disconnected' }}
          </p>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
            {{ wsConnectionStatus }}
          </p>
          <div class="mt-3 text-xs text-gray-500">Port: 3002</div>
        </div>

        <!-- HTTP Service Status -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full" :class="getStatusColor(httpStatus)"></div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">HTTP Service</p>
            </div>
            <div class="text-xs text-gray-500">{{ httpUptime }}</div>
          </div>
          <p class="text-xl sm:text-2xl font-bold" :class="getStatusTextColor(httpStatus)">
            {{ httpStatus || 'Unknown' }}
          </p>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
            {{ httpResponseTime ? `${httpResponseTime}ms` : 'Not checked' }}
          </p>
          <div class="mt-3 text-xs text-gray-500">Port: 3001</div>
        </div>

        <!-- Database Status -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full" :class="getStatusColor(dbStatus)"></div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Database</p>
            </div>
            <div class="text-xs text-gray-500">{{ dbUptime }}</div>
          </div>
          <p class="text-xl sm:text-2xl font-bold" :class="getStatusTextColor(dbStatus)">
            {{ dbStatus || 'Unknown' }}
          </p>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
            {{ dbResponseTime ? `${dbResponseTime}ms` : 'Not checked' }}
          </p>
          <div class="mt-3 text-xs text-gray-500">Port: 2113</div>
        </div>

        <!-- Overall Health -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full" :class="getStatusColor(overallHealth)"></div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Overall Health</p>
            </div>
            <div class="text-xs text-gray-500">{{ lastUpdated }}</div>
          </div>
          <p class="text-xl sm:text-2xl font-bold" :class="getStatusTextColor(overallHealth)">
            {{ overallHealth || 'Unknown' }}
          </p>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
            {{ getHealthScore() }}% Healthy
          </p>
          <div class="mt-3">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="getHealthScoreColor()"
                :style="{ width: getHealthScore() + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <!-- Response Time Chart -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Response Times
          </h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">HTTP Service</span>
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                <span class="text-sm font-medium">{{ httpResponseTime || 0 }}ms</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Database</span>
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 rounded-full bg-purple-500"></div>
                <span class="text-sm font-medium">{{ dbResponseTime || 0 }}ms</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">WebSocket Latency</span>
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                <span class="text-sm font-medium">{{ wsLatency || 0 }}ms</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Service Uptime -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Service Uptime
          </h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">HTTP Service</span>
              <span class="text-sm font-medium text-green-600">{{ httpUptime }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Database</span>
              <span class="text-sm font-medium text-green-600">{{ dbUptime }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">WebSocket</span>
              <span class="text-sm font-medium text-green-600">{{ wsUptime }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- WebSocket Messages -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-0">
            WebSocket Messages
          </h2>
          <div class="flex space-x-2">
            <button
              @click="clearMessages"
              class="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Clear
            </button>
            <button
              @click="exportMessages"
              class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Export
            </button>
          </div>
        </div>
        <div
          class="h-64 sm:h-80 overflow-y-auto bg-gray-100 dark:bg-gray-700 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm"
        >
          <div
            v-if="wsMessages.length === 0"
            class="text-gray-500 dark:text-gray-400 text-center py-8"
          >
            No messages received yet
          </div>
          <div
            v-for="(message, index) in wsMessages"
            :key="index"
            class="mb-2 p-2 bg-white dark:bg-gray-800 rounded border-l-4"
            :class="getMessageBorderClass(message.type)"
          >
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0"
            >
              <span class="font-medium text-gray-900 dark:text-white text-xs">
                {{ new Date(message.timestamp).toLocaleTimeString() }}
              </span>
              <span class="text-xs px-2 py-1 rounded" :class="getMessageBadgeClass(message.type)">
                {{ message.type }}
              </span>
            </div>
            <div class="text-gray-700 dark:text-gray-300 mt-1 break-words">
              {{ message.content }}
            </div>
          </div>
        </div>
      </div>

      <!-- Health Check Details -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <!-- HTTP Service Details -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
            HTTP Service Details
          </h2>
          <div v-if="httpDetails" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Status</p>
                <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {{ httpDetails.status }}
                </p>
              </div>
              <div>
                <p class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                  Response Time
                </p>
                <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {{ httpDetails.responseTime }}ms
                </p>
              </div>
              <div>
                <p class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Service</p>
                <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {{ httpDetails.service }}
                </p>
              </div>
              <div>
                <p class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Version</p>
                <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {{ httpDetails.version }}
                </p>
              </div>
            </div>
            <div v-if="httpDetails.kurrentdb_url" class="pt-3 border-t">
              <p class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                KurrentDB URL
              </p>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-mono break-all">
                {{ httpDetails.kurrentdb_url }}
              </p>
            </div>
          </div>
          <div v-else class="text-center text-gray-500 dark:text-gray-400 py-8">
            No HTTP health data available
          </div>
        </div>

        <!-- Database Details -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Database Details
          </h2>
          <div v-if="dbDetails" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Status</p>
                <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {{ dbDetails.status }}
                </p>
              </div>
              <div>
                <p class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                  Connected
                </p>
                <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {{ dbDetails.connected ? 'Yes' : 'No' }}
                </p>
              </div>
              <div>
                <p class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                  Connection Status
                </p>
                <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {{ dbDetails.connectionStatus }}
                </p>
              </div>
              <div>
                <p class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                  Response Time
                </p>
                <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {{ dbDetails.responseTime }}ms
                </p>
              </div>
            </div>
            <div class="pt-3 border-t">
              <p class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Last Check</p>
              <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {{ new Date(dbDetails.timestamp).toLocaleString() }}
              </p>
            </div>
          </div>
          <div v-else class="text-center text-gray-500 dark:text-gray-400 py-8">
            No database health data available
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div
        v-if="error"
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-300">
              {{ error }}
            </div>
          </div>
          <div class="ml-auto pl-3">
            <button @click="clearError" class="inline-flex text-red-400 hover:text-red-500">
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'

  // WebSocket state
  const ws = ref<WebSocket | null>(null)
  const wsConnected = ref(false)
  const wsConnecting = ref(false)
  const wsConnectionStatus = ref('Disconnected')
  const wsMessages = ref<Array<{ type: string; content: string; timestamp: Date }>>([])

  // HTTP health state
  const httpStatus = ref<string>('')
  const httpChecking = ref(false)
  const httpResponseTime = ref<number | null>(null)
  const httpDetails = ref<{
    status: string
    responseTime: number
    service?: string
    version?: string
    kurrentdb_url?: string
    timestamp?: string
  } | null>(null)

  // Database health state
  const dbStatus = ref<string>('')
  const dbChecking = ref(false)
  const dbResponseTime = ref<number | null>(null)
  const dbDetails = ref<{
    status: string
    connected: boolean
    connectionStatus: string
    responseTime: number
    timestamp: string
  } | null>(null)

  // Error state
  const error = ref<string>('')

  // Auto-refresh state
  const autoRefresh = ref(true)
  const autoRefreshInterval = ref(5) // seconds

  // Computed properties
  const overallHealth = computed(() => {
    if (!wsConnected.value && !httpStatus.value && !dbStatus.value) return ''

    const statuses = []
    if (wsConnected.value) statuses.push('healthy')
    if (httpStatus.value) statuses.push(httpStatus.value)
    if (dbStatus.value) statuses.push(dbStatus.value)

    if (statuses.every(s => s === 'healthy')) return 'healthy'
    if (statuses.some(s => s === 'healthy')) return 'degraded'
    return 'unhealthy'
  })

  const lastUpdated = computed(() => {
    const timestamps = []
    if (httpDetails.value?.timestamp) timestamps.push(new Date(httpDetails.value.timestamp))
    if (dbDetails.value?.timestamp) timestamps.push(new Date(dbDetails.value.timestamp))

    if (timestamps.length === 0) return 'Never'

    const latest = new Date(Math.max(...timestamps.map(t => t.getTime())))
    return latest.toLocaleString()
  })

  const wsUptime = computed(() => {
    if (!wsConnected.value) return 'N/A'
    const now = new Date()
    const connectedTime = new Date(
      ws.value?.readyState === WebSocket.OPEN ? ws.value.readyState : 0
    )
    const uptime = now.getTime() - connectedTime.getTime()
    const uptimeSeconds = uptime / 1000
    return `${uptimeSeconds.toFixed(0)}s`
  })

  const httpUptime = computed(() => {
    if (!httpStatus.value) return 'N/A'
    const now = new Date()
    const lastCheckTime = new Date(httpDetails.value?.timestamp || 0)
    const uptime = now.getTime() - lastCheckTime.getTime()
    const uptimeSeconds = uptime / 1000
    return `${uptimeSeconds.toFixed(0)}s`
  })

  const dbUptime = computed(() => {
    if (!dbStatus.value) return 'N/A'
    const now = new Date()
    const lastCheckTime = new Date(dbDetails.value?.timestamp || 0)
    const uptime = now.getTime() - lastCheckTime.getTime()
    const uptimeSeconds = uptime / 1000
    return `${uptimeSeconds.toFixed(0)}s`
  })

  const wsLatency = computed(() => {
    if (!wsConnected.value) return 0
    const now = new Date()
    const lastMessageTime = new Date(wsMessages.value[wsMessages.value.length - 1]?.timestamp || 0)
    const latency = now.getTime() - lastMessageTime.getTime()
    return latency
  })

  const isCheckingAll = computed(() => {
    return httpChecking.value || dbChecking.value
  })

  // WebSocket methods
  const connectWebSocket = () => {
    if (ws.value?.readyState === WebSocket.OPEN) return

    wsConnecting.value = true
    wsConnectionStatus.value = 'Connecting...'

    try {
      const wsUrl = 'ws://localhost:3002/ws/health'
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        wsConnected.value = true
        wsConnecting.value = false
        wsConnectionStatus.value = 'Connected'
        addMessage('info', 'WebSocket connected successfully')
      }

      ws.value.onmessage = event => {
        try {
          const data = JSON.parse(event.data)
          addMessage('data', `Received: ${JSON.stringify(data, null, 2)}`)
        } catch {
          addMessage('data', `Raw message: ${event.data}`)
        }
      }

      ws.value.onclose = event => {
        wsConnected.value = false
        wsConnecting.value = false
        wsConnectionStatus.value = `Disconnected (${event.code}: ${event.reason || 'No reason'})`
        addMessage('warning', `WebSocket disconnected: ${event.code} ${event.reason || ''}`)
      }

      ws.value.onerror = event => {
        wsConnected.value = false
        wsConnecting.value = false
        wsConnectionStatus.value = 'Connection error'
        addMessage('error', 'WebSocket connection error')
        console.error('WebSocket error:', event)
      }
    } catch (err) {
      wsConnecting.value = false
      wsConnectionStatus.value = 'Failed to connect'
      addMessage('error', `Failed to connect: ${err}`)
      setError(`Failed to connect WebSocket: ${err}`)
    }
  }

  const disconnectWebSocket = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }

  const addMessage = (type: string, content: string) => {
    wsMessages.value.unshift({
      type,
      content,
      timestamp: new Date(),
    })

    // Keep only last 100 messages
    if (wsMessages.value.length > 100) {
      wsMessages.value = wsMessages.value.slice(0, 100)
    }
  }

  const clearMessages = () => {
    wsMessages.value = []
  }

  const exportMessages = () => {
    const dataStr = JSON.stringify(wsMessages.value, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'websocket_messages.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // HTTP health check methods
  const checkHTTPHealth = async () => {
    httpChecking.value = true
    const startTime = Date.now()

    try {
      const response = await fetch('http://localhost:3001/health')
      const endTime = Date.now()
      const responseTime = endTime - startTime

      if (response.ok) {
        const data = await response.json()
        httpStatus.value = 'healthy'
        httpResponseTime.value = responseTime
        httpDetails.value = { ...data, responseTime }
        addMessage('info', `HTTP health check successful: ${responseTime}ms`)
      } else {
        httpStatus.value = 'unhealthy'
        httpResponseTime.value = responseTime
        httpDetails.value = { status: 'unhealthy', responseTime }
        addMessage('error', `HTTP health check failed: ${response.status}`)
      }
    } catch (err) {
      httpStatus.value = 'unhealthy'
      httpResponseTime.value = null
      httpDetails.value = null
      addMessage('error', `HTTP health check error: ${err}`)
      setError(`HTTP health check failed: ${err}`)
    } finally {
      httpChecking.value = false
    }
  }

  const checkAllServices = async () => {
    httpChecking.value = true
    dbChecking.value = true
    await Promise.all([checkHTTPHealth(), checkDBHealth()])
    httpChecking.value = false
    dbChecking.value = false
  }

  // Database health check methods
  const checkDBHealth = async () => {
    dbChecking.value = true
    const startTime = Date.now()

    try {
      const response = await fetch('http://localhost:3001/health/kurrentdb')
      const endTime = Date.now()
      const responseTime = endTime - startTime

      if (response.ok) {
        const data = await response.json()
        dbStatus.value = data.status === 'healthy' ? 'healthy' : 'degraded'
        dbResponseTime.value = responseTime
        dbDetails.value = { ...data, responseTime }
        addMessage('info', `Database health check successful: ${responseTime}ms`)
      } else {
        dbStatus.value = 'unhealthy'
        dbResponseTime.value = responseTime
        dbDetails.value = {
          status: 'unhealthy',
          connected: false,
          connectionStatus: 'error',
          responseTime,
          timestamp: new Date().toISOString(),
        }
        addMessage('error', `Database health check failed: ${response.status}`)
      }
    } catch (err) {
      dbStatus.value = 'unhealthy'
      dbResponseTime.value = null
      dbDetails.value = null
      addMessage('error', `Database health check error: ${err}`)
      setError(`Database health check failed: ${err}`)
    } finally {
      dbChecking.value = false
    }
  }

  // Utility methods
  const setError = (message: string) => {
    error.value = message
  }

  const clearError = () => {
    error.value = ''
  }

  const clearAllData = () => {
    wsConnected.value = false
    wsConnecting.value = false
    wsConnectionStatus.value = 'Disconnected'
    httpStatus.value = ''
    httpChecking.value = false
    httpResponseTime.value = null
    httpDetails.value = null
    dbStatus.value = ''
    dbChecking.value = false
    dbResponseTime.value = null
    dbDetails.value = null
    // overallHealth is computed, so we don't need to reset it
    wsMessages.value = []
    clearError()
    addMessage('info', 'All data cleared.')
  }

  const getMessageBorderClass = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-500'
      case 'warning':
        return 'border-yellow-500'
      case 'info':
        return 'border-blue-500'
      case 'data':
        return 'border-green-500'
      default:
        return 'border-gray-300'
    }
  }

  const getMessageBadgeClass = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'data':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500'
      case 'degraded':
        return 'bg-yellow-500'
      case 'unhealthy':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600'
      case 'degraded':
        return 'text-yellow-600'
      case 'unhealthy':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getHealthScore = () => {
    const statuses = [wsConnected.value, httpStatus.value, dbStatus.value].filter(Boolean)
    if (statuses.length === 0) return 0

    const healthyCount = statuses.filter(s => s === 'healthy').length
    return Math.round((healthyCount / statuses.length) * 100)
  }

  const getHealthScoreColor = () => {
    const score = getHealthScore()
    if (score >= 80) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Lifecycle
  onMounted(() => {
    // Auto-check HTTP health on mount
    checkHTTPHealth()
    checkDBHealth()

    if (autoRefresh.value) {
      const interval = setInterval(() => {
        checkHTTPHealth()
        checkDBHealth()
      }, autoRefreshInterval.value * 1000)
      onUnmounted(() => clearInterval(interval))
    }
  })

  onUnmounted(() => {
    if (ws.value) {
      ws.value.close()
    }
  })
</script>
