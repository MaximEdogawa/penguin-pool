import { ref, computed, onMounted, onUnmounted } from 'vue'
import { io, type Socket } from 'socket.io-client'
import {
  uptimeService,
  type ServiceUptimeSummary,
  type ServiceUptimeTimeline,
} from '../services/UptimeService'

export function useUptime() {
  // State
  const uptimeSummaries = ref<ServiceUptimeSummary[]>([])
  const currentStatuses = ref<Record<string, 'up' | 'down' | 'degraded'>>({})
  const loading = ref(false)
  const error = ref<string>('')
  const lastUpdated = ref<Date | null>(null)
  const autoRefresh = ref(true)
  const refreshInterval = ref(30) // seconds
  const selectedPeriod = ref(24) // hours (1 day)

  // WebSocket state for real-time updates
  const ws = ref<Socket | null>(null)
  const wsConnected = ref(false)
  const wsConnecting = ref(false)
  const wsError = ref<string>('')

  // Computed
  const overallHealth = computed(() => {
    const services = uptimeSummaries.value
    if (services.length === 0) return 'unknown'

    // Calculate overall uptime percentage
    const totalPercentage = services.reduce((sum, service) => sum + service.uptimePercentage, 0)
    const averageUptime = totalPercentage / services.length

    // Health thresholds:
    // - Healthy: >= 60% average uptime across all services
    // - Degraded: >= 30% average uptime across all services
    // - Unhealthy: < 30% average uptime across all services
    if (averageUptime >= 60) {
      return 'healthy'
    } else if (averageUptime >= 30) {
      return 'degraded'
    } else {
      return 'unhealthy'
    }
  })

  const overallUptimePercentage = computed(() => {
    const services = uptimeSummaries.value
    if (services.length === 0) return 0

    const totalPercentage = services.reduce((sum, service) => sum + service.uptimePercentage, 0)
    return totalPercentage / services.length
  })

  const healthScore = computed(() => {
    return Math.round(overallUptimePercentage.value)
  })

  const healthScoreColor = computed(() => {
    const score = healthScore.value
    if (score >= 60) return 'bg-green-500' // Healthy threshold
    if (score >= 30) return 'bg-yellow-500' // Degraded threshold
    return 'bg-red-500' // Unhealthy
  })

  // Methods
  const fetchUptimeData = async () => {
    loading.value = true
    error.value = ''

    try {
      const [summaryResponse, statusResponse] = await Promise.all([
        uptimeService.getUptimeSummary(selectedPeriod.value),
        uptimeService.getCurrentStatuses(),
      ])

      uptimeSummaries.value = summaryResponse.services
      currentStatuses.value = statusResponse.services
      lastUpdated.value = new Date()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch uptime data'
      console.error('Error fetching uptime data:', err)
    } finally {
      loading.value = false
    }
  }

  const getServiceUptime = (serviceName: string): ServiceUptimeSummary | undefined => {
    return uptimeSummaries.value.find(s => s.serviceName === serviceName)
  }

  const getServiceStatus = (serviceName: string): 'up' | 'down' | 'degraded' => {
    return currentStatuses.value[serviceName] || 'down'
  }

  const refreshData = async () => {
    await fetchUptimeData()
  }

  const setPeriod = (hours: number) => {
    selectedPeriod.value = hours
    fetchUptimeData()
  }

  const toggleAutoRefresh = () => {
    autoRefresh.value = !autoRefresh.value
  }

  const setRefreshInterval = (seconds: number) => {
    refreshInterval.value = seconds
  }

  // WebSocket methods for real-time updates
  const connectWebSocket = () => {
    if (ws.value?.connected) return

    wsConnecting.value = true
    wsError.value = ''

    try {
      ws.value = io('http://localhost:3002/ws/health', {
        transports: ['websocket'],
      })

      ws.value.on('connect', () => {
        wsConnected.value = true
        wsConnecting.value = false
        wsError.value = ''
        console.log('Connected to health/uptime WebSocket')
      })

      ws.value.on('service_status_change', data => {
        // Update current statuses in real-time
        currentStatuses.value[data.serviceName] = data.status

        // Trigger a refresh of the uptime data to get updated percentages
        if (autoRefresh.value) {
          fetchUptimeData()
        }

        console.log(`Real-time status update: ${data.serviceName} is now ${data.status}`)
      })

      ws.value.on('health_status', data => {
        console.log('Received health status:', data)
      })

      ws.value.on('disconnect', reason => {
        wsConnected.value = false
        wsConnecting.value = false
        wsError.value = `WebSocket disconnected: ${reason}`
        console.log('Health/uptime WebSocket disconnected')
      })

      ws.value.on('connect_error', error => {
        wsConnecting.value = false
        wsError.value = 'WebSocket connection error'
        console.error('Health/uptime WebSocket error:', error)
      })
    } catch (err) {
      wsConnecting.value = false
      wsError.value = 'Failed to create WebSocket connection'
      console.error('Failed to connect to health/uptime WebSocket:', err)
    }
  }

  const disconnectWebSocket = () => {
    if (ws.value) {
      ws.value.disconnect()
      ws.value = null
    }
    wsConnected.value = false
    wsConnecting.value = false
  }

  // Auto-refresh setup
  let refreshTimer: ReturnType<typeof setInterval> | null = null

  const startAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }

    if (autoRefresh.value) {
      refreshTimer = setInterval(() => {
        fetchUptimeData()
      }, refreshInterval.value * 1000)
    }
  }

  const stopAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  // Lifecycle
  onMounted(() => {
    fetchUptimeData()
    startAutoRefresh()
    connectWebSocket()
  })

  onUnmounted(() => {
    stopAutoRefresh()
    disconnectWebSocket()
  })

  // Watch for auto-refresh changes
  const watchAutoRefresh = () => {
    if (autoRefresh.value) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }

  return {
    // State
    uptimeSummaries,
    currentStatuses,
    loading,
    error,
    lastUpdated,
    autoRefresh,
    refreshInterval,
    selectedPeriod,

    // WebSocket state
    ws,
    wsConnected,
    wsConnecting,
    wsError,

    // Computed
    overallHealth,
    overallUptimePercentage,
    healthScore,
    healthScoreColor,

    // Methods
    fetchUptimeData,
    getServiceUptime,
    getServiceStatus,
    refreshData,
    setPeriod,
    toggleAutoRefresh,
    setRefreshInterval,
    startAutoRefresh,
    stopAutoRefresh,
    watchAutoRefresh,
    connectWebSocket,
    disconnectWebSocket,
  }
}

export function useServiceTimeline(serviceName: string) {
  const timeline = ref<ServiceUptimeTimeline | null>(null)
  const loading = ref(false)
  const error = ref<string>('')
  const period = ref(24) // hours

  const fetchTimeline = async () => {
    loading.value = true
    error.value = ''

    try {
      const response = await uptimeService.getServiceTimeline(serviceName, period.value)
      timeline.value = response.timeline
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch timeline'
      console.error('Error fetching timeline:', err)
    } finally {
      loading.value = false
    }
  }

  const setPeriod = (hours: number) => {
    period.value = hours
    fetchTimeline()
  }

  onMounted(() => {
    fetchTimeline()
  })

  return {
    timeline,
    loading,
    error,
    period,
    fetchTimeline,
    setPeriod,
  }
}
