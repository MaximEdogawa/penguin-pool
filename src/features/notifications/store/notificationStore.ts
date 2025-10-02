import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    handler: () => void
  }
}

export const useNotificationStore = defineStore('notifications', () => {
  // State
  const notifications = ref<Notification[]>([])
  const isInitialized = ref(false)

  // Getters
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
  const hasNotifications = computed(() => notifications.value.length > 0)
  const recentNotifications = computed(() =>
    notifications.value
      .slice()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5)
  )

  // Actions
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date(),
      read: false,
    }

    notifications.value.unshift(newNotification)

    // Auto-remove after 5 seconds for non-error notifications
    if (notification.type !== 'error') {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 5000)
    }
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const markAsRead = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  const markAllAsRead = () => {
    notifications.value.forEach(n => (n.read = true))
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  const clearReadNotifications = () => {
    notifications.value = notifications.value.filter(n => !n.read)
  }

  // Convenience methods
  const addInfo = (
    title: string,
    message: string,
    action?: { label: string; handler: () => void }
  ) => {
    addNotification({ type: 'info', title, message, action })
  }

  const addSuccess = (
    title: string,
    message: string,
    action?: { label: string; handler: () => void }
  ) => {
    addNotification({ type: 'success', title, message, action })
  }

  const addWarning = (
    title: string,
    message: string,
    action?: { label: string; handler: () => void }
  ) => {
    addNotification({ type: 'warning', title, message, action })
  }

  const addError = (
    title: string,
    message: string,
    action?: { label: string; handler: () => void }
  ) => {
    addNotification({ type: 'error', title, message, action })
  }

  const initialize = async () => {
    try {
      // Load notifications from localStorage if available
      const stored = localStorage.getItem('penguin-pool-notifications')
      if (stored) {
        const parsed = JSON.parse(stored)
        notifications.value = parsed.map((n: Record<string, unknown>) => ({
          ...n,
          timestamp: new Date(n.timestamp as string),
        }))
      }

      isInitialized.value = true
    } catch {
      // Failed to initialize notifications
      isInitialized.value = true
    }
  }

  // Helper function
  const generateId = (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  return {
    // State
    notifications,
    isInitialized,

    // Getters
    unreadCount,
    hasNotifications,
    recentNotifications,

    // Actions
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearReadNotifications,

    // Convenience methods
    addInfo,
    addSuccess,
    addWarning,
    addError,

    // Initialization
    initialize,
  }
})
