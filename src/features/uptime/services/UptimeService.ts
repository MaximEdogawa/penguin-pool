export interface ServiceUptimeSummary {
  serviceName: string
  currentStatus: 'up' | 'down' | 'degraded'
  uptimePercentage: number
  totalUptime: string
  totalDowntime: string
  lastStatusChange: string
  isCurrentlyUp: boolean
}

export interface ServiceUptimeRecord {
  id: string
  serviceName: string
  status: 'up' | 'down' | 'degraded'
  timestamp: string
  duration?: number
  metadata?: {
    responseTime?: number
    error?: string
    performanceGrade?: string
  }
}

export interface ServiceUptimeTimeline {
  serviceName: string
  totalUptime: number
  totalDowntime: number
  uptimePercentage: number
  currentStatus: 'up' | 'down' | 'degraded'
  lastStatusChange: string
  timeline: ServiceUptimeRecord[]
  startTime: string
  endTime: string
}

export interface UptimeSummaryResponse {
  timestamp: string
  period: string
  services: ServiceUptimeSummary[]
}

export interface ServiceUptimeResponse {
  timestamp: string
  period: string
  service: ServiceUptimeSummary
}

export interface ServiceTimelineResponse {
  timestamp: string
  period: string
  timeline: ServiceUptimeTimeline
}

export interface CurrentStatusResponse {
  timestamp: string
  services: Record<string, 'up' | 'down' | 'degraded'>
}

export class UptimeService {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl
  }

  /**
   * Get uptime summary for all services
   */
  async getUptimeSummary(hours: number = 24): Promise<UptimeSummaryResponse> {
    const response = await fetch(`${this.baseUrl}/api/uptime/summary?hours=${hours}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch uptime summary: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get uptime summary for a specific service
   */
  async getServiceUptime(serviceName: string, hours: number = 24): Promise<ServiceUptimeResponse> {
    const response = await fetch(`${this.baseUrl}/api/uptime/service/${serviceName}?hours=${hours}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch service uptime: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get detailed timeline for a specific service
   */
  async getServiceTimeline(
    serviceName: string,
    hours: number = 24
  ): Promise<ServiceTimelineResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/uptime/timeline/${serviceName}?hours=${hours}`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch service timeline: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get current status of all services
   */
  async getCurrentStatuses(): Promise<CurrentStatusResponse> {
    const response = await fetch(`${this.baseUrl}/api/uptime/status`)

    if (!response.ok) {
      throw new Error(`Failed to fetch current statuses: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Format uptime percentage for display
   */
  formatUptimePercentage(percentage: number): string {
    return `${percentage.toFixed(1)}%`
  }

  /**
   * Get status color class for UI
   */
  getStatusColor(status: 'up' | 'down' | 'degraded'): string {
    switch (status) {
      case 'up':
        return 'text-green-600'
      case 'degraded':
        return 'text-yellow-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  /**
   * Get status background color class for UI
   */
  getStatusBgColor(status: 'up' | 'down' | 'degraded'): string {
    switch (status) {
      case 'up':
        return 'bg-green-500'
      case 'degraded':
        return 'bg-yellow-500'
      case 'down':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  /**
   * Get status indicator color class for UI
   */
  getStatusIndicatorColor(status: 'up' | 'down' | 'degraded'): string {
    switch (status) {
      case 'up':
        return 'bg-green-400'
      case 'degraded':
        return 'bg-yellow-400'
      case 'down':
        return 'bg-red-400'
      default:
        return 'bg-gray-400'
    }
  }

  /**
   * Get performance grade color class for UI
   */
  getPerformanceGradeColor(grade: string): string {
    switch (grade) {
      case 'excellent':
        return 'bg-green-500'
      case 'good':
        return 'bg-blue-500'
      case 'acceptable':
        return 'bg-yellow-500'
      case 'slow':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString()
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(timestamp: string): string {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }
}

// Export singleton instance
export const uptimeService = new UptimeService()
