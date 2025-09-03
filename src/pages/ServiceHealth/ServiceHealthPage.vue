<template>
  <div class="content-page">
    <div class="content-body">
      <!-- Header -->
      <div class="card p-4 sm:p-6">
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
                @change="watchAutoRefresh"
                type="checkbox"
                class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Auto-refresh
            </label>
            <span class="text-xs text-gray-500">{{ refreshInterval }}s</span>
          </div>
        </div>
      </div>

      <!-- Connection Controls -->
      <div class="card p-4 sm:p-6">
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
        <div class="card p-4 sm:p-6">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <div
                class="w-3 h-3 rounded-full"
                :class="wsConnected ? 'bg-green-500' : 'bg-red-500'"
              ></div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">WebSocket</p>
            </div>
            <div class="text-xs text-gray-500">
              {{
                getServiceUptime('websocket')?.uptimePercentage
                  ? uptimeService.formatUptimePercentage(
                      getServiceUptime('websocket')!.uptimePercentage
                    )
                  : 'N/A'
              }}
            </div>
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
        <div class="card p-4 sm:p-6">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full" :class="getStatusColor(httpStatus)"></div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">HTTP Service</p>
            </div>
            <div class="text-xs text-gray-500">
              {{
                getServiceUptime('http')?.uptimePercentage
                  ? uptimeService.formatUptimePercentage(getServiceUptime('http')!.uptimePercentage)
                  : 'N/A'
              }}
            </div>
          </div>
          <p class="text-xl sm:text-2xl font-bold" :class="getStatusTextColor(httpStatus)">
            {{ httpStatus || 'Unknown' }}
          </p>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
            {{ httpResponseTime ? `${httpResponseTime}ms` : 'Not checked' }}
          </p>
          <div class="mt-3 text-xs text-gray-500">Port: 3002</div>
        </div>

        <!-- Database Status -->
        <div class="card p-4 sm:p-6">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 rounded-full" :class="getStatusColor(dbStatus)"></div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Database</p>
            </div>
            <div class="text-xs text-gray-500">
              {{
                getServiceUptime('database')?.uptimePercentage
                  ? uptimeService.formatUptimePercentage(
                      getServiceUptime('database')!.uptimePercentage
                    )
                  : 'N/A'
              }}
            </div>
          </div>
          <p class="text-xl sm:text-2xl font-bold" :class="getStatusTextColor(dbStatus)">
            {{ dbStatus || 'Unknown' }}
          </p>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
            {{ dbResponseTime ? `${dbResponseTime}ms` : 'Not checked' }}
          </p>
          <p
            v-if="dbDetails?.performanceGrade"
            class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1"
          >
            Performance:
            <span class="font-medium capitalize">{{ dbDetails.performanceGrade }}</span>
          </p>
          <div class="mt-3 text-xs text-gray-500">Port: 2113</div>
        </div>

        <!-- Overall Health -->
        <div class="card p-4 sm:p-6">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <div
                class="w-3 h-3 rounded-full"
                :class="uptimeService.getStatusBgColor(mapToUptimeStatus(overallHealth))"
              ></div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Overall Health</p>
            </div>
            <div class="text-xs text-gray-500">
              {{
                lastUpdated ? uptimeService.formatRelativeTime(lastUpdated.toISOString()) : 'Never'
              }}
            </div>
          </div>
          <p
            class="text-xl sm:text-2xl font-bold"
            :class="uptimeService.getStatusColor(mapToUptimeStatus(overallHealth))"
          >
            {{ overallHealth || 'Unknown' }}
          </p>
          <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
            {{ uptimeService.formatUptimePercentage(overallUptimePercentage) }} Uptime
          </p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Healthy: ≥60% • Degraded: ≥30% • Unhealthy: &lt;30%
          </p>
          <div class="mt-3">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="healthScoreColor"
                :style="{ width: healthScore + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <!-- Response Time Chart -->
        <div class="card p-4 sm:p-6">
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
            <div v-if="dbDetails?.performanceGrade" class="flex items-center justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-500 ml-4">Performance Grade</span>
              <div class="flex items-center space-x-2">
                <div
                  class="w-2 h-2 rounded-full"
                  :class="getPerformanceGradeColor(dbDetails.performanceGrade)"
                ></div>
                <span class="text-xs font-medium capitalize text-gray-600 dark:text-gray-400">{{
                  dbDetails.performanceGrade
                }}</span>
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

        <!-- Service Uptime Timeline -->
        <div class="card p-4 sm:p-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-0">
              Service Uptime Timeline
            </h2>
            <div class="flex items-center space-x-2">
              <select
                v-model="selectedPeriod"
                @change="setPeriod(selectedPeriod)"
                class="text-sm border border-gray-300 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-600"
              >
                <option :value="24">Last 1 day</option>
                <option :value="168">Last 1 week</option>
                <option :value="720">Last 1 month</option>
                <option :value="8760">Last 1 year</option>
                <option :value="-1">All time</option>
              </select>
            </div>
          </div>
          <div class="space-y-3">
            <div
              v-for="service in uptimeSummaries"
              :key="service.serviceName"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <div
                  class="w-3 h-3 rounded-full"
                  :class="uptimeService.getStatusIndicatorColor(service.currentStatus)"
                ></div>
                <span class="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {{ service.serviceName }} Service
                </span>
              </div>
              <div class="text-right">
                <div
                  class="text-sm font-medium"
                  :class="uptimeService.getStatusColor(service.currentStatus)"
                >
                  {{ uptimeService.formatUptimePercentage(service.uptimePercentage) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ service.totalUptime }}
                </div>
              </div>
            </div>
            <div
              v-if="uptimeSummaries.length === 0"
              class="text-center text-gray-500 dark:text-gray-400 py-4"
            >
              No uptime data available
            </div>
          </div>
        </div>
      </div>

      <!-- WebSocket Messages -->
      <div class="card p-4 sm:p-6">
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
          class="h-64 sm:h-80 overflow-y-auto overflow-x-hidden bg-gray-100 dark:bg-gray-700 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm"
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
        <div class="card p-4 sm:p-6">
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
        <div class="card p-4 sm:p-6">
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
      <div v-if="error" class="card p-4 sm:p-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
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
  import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'
  import { io, type Socket } from 'socket.io-client'
  import { useUptime } from '@/features/uptime/composables/useUptime'
  import { uptimeService } from '@/features/uptime/services/UptimeService'

  // Configuration
  const KURRENTDB_URL = 'http://localhost:2113'

  // Uptime tracking
  const {
    uptimeSummaries,
    lastUpdated,
    autoRefresh,
    refreshInterval,
    selectedPeriod,
    overallHealth,
    overallUptimePercentage,
    healthScore,
    healthScoreColor,
    getServiceUptime,
    refreshData,
    setPeriod,
    watchAutoRefresh,
    // WebSocket state for real-time updates (handled automatically by composable)
  } = useUptime()

  // WebSocket state
  const ws = ref<Socket | null>(null)
  const wsConnected = ref(false)
  const wsConnecting = ref(false)
  const wsConnectionStatus = ref('Disconnected')
  const wsMessages = ref<Array<{ type: string; content: string; timestamp: Date }>>([])
  const wsConnectionTime = ref<Date | null>(null) // Track the time when WebSocket was connected

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
    performanceGrade?: string
    thresholds?: {
      excellent: number
      good: number
      acceptable: number
    }
    error?: string
    dbInfo?: {
      version: string
      state: string
      features: Record<string, boolean>
    }
  } | null>(null)

  const error = ref<string>('')
  const lastSendWSMessageTime: Ref<Date> = ref(new Date())

  const wsLatency = computed(() => {
    if (!wsConnected.value) return 0
    const lastMessageTime = new Date(wsMessages.value[wsMessages.value.length - 1]?.timestamp || 0)
    const latency = lastSendWSMessageTime.value.getTime() - lastMessageTime.getTime()
    return latency
  })

  const isCheckingAll = computed(() => {
    return httpChecking.value || dbChecking.value
  })

  // WebSocket methods
  const connectWebSocket = () => {
    if (ws.value?.connected) return

    wsConnecting.value = true
    wsConnectionStatus.value = 'Connecting...'

    try {
      ws.value = io('http://localhost:3002/ws/health', {
        transports: ['websocket'],
      })

      ws.value.on('connect', () => {
        wsConnected.value = true
        wsConnecting.value = false
        wsConnectionStatus.value = 'Connected'
        wsConnectionTime.value = new Date() // Set the connection time
        addMessage('info', 'WebSocket connected successfully')
      })

      ws.value.on('service_status_change', data => {
        addMessage('data', `Service status change: ${JSON.stringify(data, null, 2)}`)
      })

      ws.value.on('health_status', data => {
        addMessage('data', `Health status: ${JSON.stringify(data, null, 2)}`)
      })

      ws.value.on('disconnect', reason => {
        wsConnected.value = false
        wsConnecting.value = false
        wsConnectionStatus.value = `Disconnected (${reason})`
        wsConnectionTime.value = null // Reset connection time on disconnect
        addMessage('warning', `WebSocket disconnected: ${reason}`)
      })

      ws.value.on('connect_error', error => {
        wsConnected.value = false
        wsConnecting.value = false
        wsConnectionStatus.value = 'Connection error'
        wsConnectionTime.value = null // Reset connection time on error
        addMessage('error', 'WebSocket connection error')
        console.error('WebSocket error:', error)
      })
    } catch (err) {
      wsConnecting.value = false
      wsConnectionStatus.value = 'Failed to connect'
      addMessage('error', `Failed to connect: ${err}`)
      setError(`Failed to connect WebSocket: ${err}`)
    }
  }

  const disconnectWebSocket = () => {
    if (ws.value) {
      ws.value.disconnect()
      ws.value = null
    }
  }

  const addMessage = (type: string, content: string) => {
    wsMessages.value.unshift({
      type,
      content,
      timestamp: new Date(),
    })
    lastSendWSMessageTime.value = new Date()

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
      const response = await fetch('http://localhost:3002/health')
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
    await Promise.all([checkHTTPHealth(), checkDBHealth(), refreshData()])
    httpChecking.value = false
    dbChecking.value = false
  }

  // Database health check methods
  const checkDBHealth = async () => {
    dbChecking.value = true
    const startTime = Date.now()

    try {
      // Connect directly to KurrentDB using the /info endpoint
      const response = await fetch(`${KURRENTDB_URL}/info`)
      const endTime = Date.now()
      const responseTime = endTime - startTime

      if (response.ok) {
        const data = await response.json()

        // Define response time thresholds
        const EXCELLENT_THRESHOLD = 50 // ms - excellent performance
        const GOOD_THRESHOLD = 100 // ms - good performance
        const ACCEPTABLE_THRESHOLD = 500 // ms - acceptable performance

        let status = 'healthy'
        let performanceGrade = 'excellent'

        if (responseTime <= EXCELLENT_THRESHOLD) {
          performanceGrade = 'excellent'
        } else if (responseTime <= GOOD_THRESHOLD) {
          performanceGrade = 'good'
        } else if (responseTime <= ACCEPTABLE_THRESHOLD) {
          performanceGrade = 'acceptable'
        } else {
          performanceGrade = 'slow'
          // Only mark as degraded if response time is very slow
          if (responseTime > 1000) {
            // 1 second
            status = 'degraded'
          }
        }

        dbStatus.value = status
        dbResponseTime.value = responseTime
        dbDetails.value = {
          status: status,
          connected: true,
          connectionStatus: 'connected',
          responseTime: responseTime,
          timestamp: new Date().toISOString(),
          performanceGrade: performanceGrade,
          thresholds: {
            excellent: EXCELLENT_THRESHOLD,
            good: GOOD_THRESHOLD,
            acceptable: ACCEPTABLE_THRESHOLD,
          },
          dbInfo: {
            version: data.dbVersion,
            state: data.state,
            features: data.features,
          },
        }
        addMessage(
          'info',
          `Database health check successful: ${responseTime}ms (${performanceGrade}) - ${data.state}`
        )
      } else {
        dbStatus.value = 'unhealthy'
        dbResponseTime.value = responseTime
        dbDetails.value = {
          status: 'unhealthy',
          connected: false,
          connectionStatus: 'error',
          responseTime: responseTime,
          timestamp: new Date().toISOString(),
          performanceGrade: 'error',
          error: `HTTP ${response.status}: ${response.statusText}`,
        }
        addMessage('error', `Database health check failed: HTTP ${response.status}`)
      }
    } catch (err) {
      dbStatus.value = 'unhealthy'
      dbResponseTime.value = null
      dbDetails.value = {
        status: 'unhealthy',
        connected: false,
        connectionStatus: 'disconnected',
        responseTime: 0,
        timestamp: new Date().toISOString(),
        performanceGrade: 'disconnected',
        error: err instanceof Error ? err.message : 'Connection failed',
      }
      addMessage('error', `Database health check error: ${err}`)
      setError(`Database connection failed: ${err}`)
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
    wsConnectionTime.value = null // Reset connection time
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

  const mapToUptimeStatus = (status: string): 'up' | 'down' | 'degraded' => {
    switch (status) {
      case 'healthy':
        return 'up'
      case 'degraded':
        return 'degraded'
      case 'unhealthy':
        return 'down'
      default:
        return 'degraded' // Changed from 'down' to 'degraded' for unknown status
    }
  }

  const getPerformanceGradeColor = (grade: string) => {
    switch (grade) {
      case 'excellent':
        return 'bg-green-500'
      case 'good':
        return 'bg-blue-500'
      case 'acceptable':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  onMounted(() => {
    connectWebSocket()
    checkHTTPHealth()
    checkDBHealth()
  })

  onUnmounted(() => {
    if (ws.value) {
      ws.value.close()
    }
  })
</script>
