import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  DatabaseConnection,
  DatabaseHealth,
  DatabaseMetrics,
  Stream,
} from '../services/KurrentDBService'
import { kurrentDBService } from '../services/KurrentDBService'

export const useKurrentDBStore = defineStore('kurrentDB', () => {
  // State
  const connection = ref<DatabaseConnection | null>(null)
  const health = ref<DatabaseHealth | null>(null)
  const metrics = ref<DatabaseMetrics | null>(null)
  const streams = ref<Stream[]>([])
  const userStreams = ref<Stream[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isConnected = computed(() => connection.value?.isConnected || false)
  const connectionStatus = computed(() => connection.value?.status || 'disconnected')
  const isUsingHTTP = computed(() => kurrentDBService.isUsingHTTP)
  const httpStatus = computed(() => kurrentDBService.getHTTPStatus())
  const totalStreams = computed(() => streams.value.length)
  const totalUserStreams = computed(() => userStreams.value.length)

  // Actions
  const initialize = async () => {
    try {
      isLoading.value = true
      error.value = null

      // Get connection status
      connection.value = await kurrentDBService.getConnection()

      // Check health
      health.value = await kurrentDBService.checkHealth()

      // Get metrics if connected
      if (isConnected.value) {
        metrics.value = await kurrentDBService.getMetrics()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize KurrentDB'
      // Failed to initialize KurrentDB store
    } finally {
      isLoading.value = false
    }
  }

  const connect = async () => {
    try {
      isLoading.value = true
      error.value = null

      await kurrentDBService.connect()
      connection.value = await kurrentDBService.getConnection()
      health.value = await kurrentDBService.checkHealth()

      if (isConnected.value) {
        metrics.value = await kurrentDBService.getMetrics()
        await loadStreams()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to connect to KurrentDB'
      // Failed to connect to KurrentDB
    } finally {
      isLoading.value = false
    }
  }

  const disconnect = async () => {
    try {
      isLoading.value = true
      error.value = null

      await kurrentDBService.disconnect()
      connection.value = await kurrentDBService.getConnection()

      // Clear local data
      streams.value = []
      userStreams.value = []
      metrics.value = null
      health.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to disconnect from KurrentDB'
      // Failed to disconnect from KurrentDB
    } finally {
      isLoading.value = false
    }
  }

  const checkHealth = async () => {
    try {
      health.value = await kurrentDBService.checkHealth()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to check health'
      // Failed to check health
    }
  }

  const loadStreams = async () => {
    try {
      // For now, we'll use mock data since we're not implementing full stream storage
      streams.value = []
      userStreams.value = []
    } catch {
      // Failed to load streams
    }
  }

  const createStream = async (request: {
    name: string
    description?: string
    data: Record<string, unknown>
    tags?: string[]
    owner: string
  }) => {
    try {
      const stream = await kurrentDBService.createStream(request)
      streams.value.push(stream)
      return stream
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create stream'
      throw err
    }
  }

  const storeUserData = async (request: {
    userId: string
    type: string
    category: string
    data: Record<string, unknown>
    isPublic?: boolean
  }) => {
    try {
      const stream = await kurrentDBService.storeUserData(
        request.userId,
        request.type,
        request.category,
        request.data
      )
      userStreams.value.push(stream)
      return stream
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to store user data'
      throw err
    }
  }

  const deleteStream = async (id: string) => {
    try {
      await kurrentDBService.deleteStream(id)
      streams.value = streams.value.filter(s => s.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete stream'
      throw err
    }
  }

  const deleteUserData = async (userId: string, type: string, category: string) => {
    try {
      await kurrentDBService.deleteUserData(userId, type, category)
      const streamName = `user-${userId}-${type}-${category}`
      userStreams.value = userStreams.value.filter(s => s.name !== streamName)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete user data'
      throw err
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    connection,
    health,
    metrics,
    streams,
    userStreams,
    isLoading,
    error,

    // Getters
    isConnected,
    connectionStatus,
    isUsingHTTP,
    httpStatus,
    totalStreams,
    totalUserStreams,

    // Actions
    initialize,
    connect,
    disconnect,
    checkHealth,
    loadStreams,
    createStream,
    storeUserData,
    deleteStream,
    deleteUserData,
    clearError,
  }
})
