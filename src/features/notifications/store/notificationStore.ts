import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Notification, NotificationType } from '@/app/types/common'

export const useNotificationStore = defineStore('notifications', () => {
  // State
  const notifications = ref<Notification[]>([])
  const maxNotifications = 50

  // Getters
  const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

  const recentNotifications = computed(() =>
    notifications.value.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10),
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

    // Limit the number of notifications
    if (notifications.value.length > maxNotifications) {
      notifications.value = notifications.value.slice(0, maxNotifications)
    }

    return newNotification
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const markAsRead = (id: string) => {
    const notification = notifications.value.find((n) => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  const markAllAsRead = () => {
    notifications.value.forEach((n) => (n.read = true))
  }

  const clearAll = () => {
    notifications.value = []
  }

  const initialize = async () => {
    // Load notifications from localStorage
    const saved = localStorage.getItem('penguin-pool-notifications')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        notifications.value = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }))
      } catch (error) {
        console.error('Failed to load notifications:', error)
      }
    }

    // Save notifications to localStorage when they change
    // This is a simple implementation - in production you might want to use a more sophisticated approach
  }

  // Helper functions
  const generateId = () => {
    return Math.random().toString(36).substr(2, 9)
  }

  // Convenience methods for different notification types
  const showInfo = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'info', title, message, duration })
  }

  const showSuccess = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'success', title, message, duration })
  }

  const showWarning = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'warning', title, message, duration })
  }

  const showError = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'error', title, message, duration })
  }

  return {
    // State
    notifications,

    // Getters
    unreadCount,
    recentNotifications,

    // Actions
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    initialize,

    // Convenience methods
    showInfo,
    showSuccess,
    showWarning,
    showError,
  }
})
