import { createLogger } from 'winston'
import { format, transports } from 'winston'
import { KurrentDBService } from './KurrentDBService'
import { WebSocket } from 'ws'
import { BACKWARDS, FORWARDS } from '@kurrent/kurrentdb-client'

const logger = createLogger({
  level: 'info',
  format: format.simple(),
  transports: [new transports.Console()],
})

export interface ServiceUptimeRecord {
  id: string
  serviceName: string
  status: 'up' | 'down' | 'degraded'
  timestamp: Date
  duration?: number // Duration in milliseconds for this status
  metadata?: {
    responseTime?: number
    error?: string
    performanceGrade?: string
  }
}

export interface ServiceUptimeTimeline {
  serviceName: string
  totalUptime: number // Total uptime in milliseconds
  totalDowntime: number // Total downtime in milliseconds
  uptimePercentage: number // Percentage of uptime
  currentStatus: 'up' | 'down' | 'degraded'
  lastStatusChange: Date
  timeline: ServiceUptimeRecord[]
  startTime: Date
  endTime: Date
}

export interface ServiceUptimeSummary {
  serviceName: string
  currentStatus: 'up' | 'down' | 'degraded'
  uptimePercentage: number
  totalUptime: string // Formatted duration
  totalDowntime: string // Formatted duration
  lastStatusChange: Date
  isCurrentlyUp: boolean
}

export interface KurrentDBEvent {
  id: string
  type: string
  data: Record<string, unknown>
  metadata: Record<string, unknown>
  position: number
  revision: bigint
  timestamp: string
  streamId: string
}

export class UptimeTrackingService {
  private uptimeRecords: Map<string, ServiceUptimeRecord[]> = new Map()
  private serviceStartTimes: Map<string, Date> = new Map()
  private currentStatuses: Map<string, 'up' | 'down' | 'degraded'> = new Map()
  private lastStatusChange: Map<string, Date> = new Map()
  private trackingInterval: NodeJS.Timeout | null = null
  private streamReadingInterval: NodeJS.Timeout | null = null
  private readonly TRACKING_INTERVAL = 30000 // 30 seconds
  private readonly STREAM_READING_INTERVAL = 10000 // 10 seconds - read from streams more frequently
  private readonly MAX_RECORDS_PER_SERVICE = 1000 // Keep last 1000 records per service
  private readonly CLEANUP_INTERVAL = 3600000 // 1 hour
  private readonly MAX_AGE_HOURS = 168 // 7 days - keep records for 1 week
  private readonly kurrentDBService: KurrentDBService
  private readonly STREAM_PREFIX = 'service-uptime'
  private lastReadPositions: Map<string, number> = new Map() // Track last read position for each stream
  private streamErrorCounts: Map<string, number> = new Map() // Track consecutive errors per stream
  private readonly MAX_STREAM_ERRORS = 5 // Max consecutive errors before backing off

  constructor() {
    this.kurrentDBService = new KurrentDBService()
    this.initialize()

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.shutdown())
    process.on('SIGINT', () => this.shutdown())
    process.on('exit', () => this.shutdown())
  }

  private async initialize(): Promise<void> {
    try {
      // Create uptime streams if they don't exist
      await this.createUptimeStreams()

      // Load existing uptime data from KurrentDB
      await this.loadUptimeDataFromDB()

      // Start tracking, stream reading, and cleanup
      this.startTracking()
      this.startStreamReading()
      this.startCleanup()

      logger.info(
        'Uptime tracking service initialized with KurrentDB persistence and stream reading'
      )
    } catch (error) {
      logger.error('Failed to initialize uptime tracking service:', error)
      // Continue with in-memory tracking even if DB fails
      this.startTracking()
      this.startCleanup()
    }
  }

  /**
   * Start tracking service uptime
   */
  public startTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval)
    }

    this.trackingInterval = setInterval(() => {
      this.recordServiceStatus()
    }, this.TRACKING_INTERVAL)

    logger.info('Service uptime tracking started')
  }

  /**
   * Stop tracking service uptime
   */
  public stopTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval)
      this.trackingInterval = null
    }
    logger.info('Service uptime tracking stopped')
  }

  /**
   * Start reading from KurrentDB streams for real-time updates
   */
  public startStreamReading(): void {
    if (this.streamReadingInterval) {
      clearInterval(this.streamReadingInterval)
    }

    this.streamReadingInterval = setInterval(() => {
      this.readNewStreamEvents()
    }, this.STREAM_READING_INTERVAL)

    logger.info('Stream reading started for real-time uptime updates')
  }

  /**
   * Stop reading from KurrentDB streams
   */
  public stopStreamReading(): void {
    if (this.streamReadingInterval) {
      clearInterval(this.streamReadingInterval)
      this.streamReadingInterval = null
    }
    logger.info('Stream reading stopped')
  }

  /**
   * Start automatic cleanup of old records
   */
  private startCleanup(): void {
    setInterval(() => {
      this.cleanupOldRecords()
    }, this.CLEANUP_INTERVAL)

    logger.info('Automatic cleanup started')
  }

  /**
   * Clean up old records to prevent memory bloat
   */
  private cleanupOldRecords(): void {
    const cutoffTime = new Date(Date.now() - this.MAX_AGE_HOURS * 60 * 60 * 1000)
    let totalRemoved = 0

    this.uptimeRecords.forEach((records, serviceName) => {
      const initialCount = records.length
      const filteredRecords = records.filter(record => record.timestamp >= cutoffTime)

      if (filteredRecords.length !== initialCount) {
        this.uptimeRecords.set(serviceName, filteredRecords)
        totalRemoved += initialCount - filteredRecords.length
      }
    })

    if (totalRemoved > 0) {
      logger.info(`Cleaned up ${totalRemoved} old uptime records`)
    }
  }

  /**
   * Record the current status of all services
   */
  private async recordServiceStatus(): Promise<void> {
    const timestamp = new Date()

    try {
      // Check HTTP service
      await this.checkAndRecordServiceStatus('http', timestamp)

      // Check WebSocket service
      await this.checkAndRecordServiceStatus('websocket', timestamp)

      // Check Database service
      await this.checkAndRecordServiceStatus('database', timestamp)
    } catch (error) {
      logger.error('Error recording service status:', error)
    }
  }

  /**
   * Check and record status for a specific service
   */
  private async checkAndRecordServiceStatus(serviceName: string, timestamp: Date): Promise<void> {
    try {
      let status: 'up' | 'down' | 'degraded' = 'down'
      const metadata: Record<string, unknown> = {}

      switch (serviceName) {
        case 'http':
          status = await this.checkHTTPService(metadata)
          break
        case 'websocket':
          status = await this.checkWebSocketService(metadata)
          break
        case 'database':
          status = await this.checkDatabaseService(metadata)
          break
      }

      // Record the status if it has changed
      const currentStatus = this.currentStatuses.get(serviceName)
      if (currentStatus !== status) {
        this.recordStatusChange(serviceName, status, timestamp, metadata)
        this.currentStatuses.set(serviceName, status)
        this.lastStatusChange.set(serviceName, timestamp)
      }

      // Initialize service start time if not set
      if (!this.serviceStartTimes.has(serviceName)) {
        this.serviceStartTimes.set(serviceName, timestamp)
      }
    } catch (error) {
      logger.error(`Error checking ${serviceName} service:`, error)
      this.recordStatusChange(serviceName, 'down', timestamp, {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Check HTTP service status
   */
  private async checkHTTPService(
    metadata: Record<string, unknown>
  ): Promise<'up' | 'down' | 'degraded'> {
    try {
      const startTime = Date.now()
      const response = await fetch('http://localhost:3001/health')
      const responseTime = Date.now() - startTime

      metadata['responseTime'] = responseTime

      if (response.ok) {
        if (responseTime <= 100) {
          metadata['performanceGrade'] = 'excellent'
          return 'up'
        } else if (responseTime <= 500) {
          metadata['performanceGrade'] = 'good'
          return 'up'
        } else {
          metadata['performanceGrade'] = 'slow'
          return 'degraded'
        }
      } else {
        metadata['error'] = `HTTP ${response.status}`
        return 'down'
      }
    } catch (error) {
      metadata['error'] = error instanceof Error ? error.message : 'Connection failed'
      return 'down'
    }
  }

  /**
   * Check WebSocket service status
   */
  private async checkWebSocketService(
    metadata: Record<string, unknown>
  ): Promise<'up' | 'down' | 'degraded'> {
    try {
      const startTime = Date.now()

      // Quick check - try to connect to WebSocket server
      // Use environment variable or default to 3002
      const wsPort = process.env['WS_PORT'] || '3002'
      const ws = new WebSocket(`ws://localhost:${wsPort}/ws/health`)

      return new Promise(resolve => {
        const timeout = setTimeout(() => {
          ws.close()
          const responseTime = Date.now() - startTime
          metadata['responseTime'] = responseTime
          metadata['error'] = 'WebSocket connection timeout'
          resolve('down')
        }, 2000) // 2 second timeout

        ws.onopen = () => {
          clearTimeout(timeout)
          const responseTime = Date.now() - startTime
          metadata['responseTime'] = responseTime
          metadata['performanceGrade'] = responseTime <= 100 ? 'excellent' : 'good'
          ws.close()
          resolve('up')
        }

        ws.onerror = () => {
          clearTimeout(timeout)
          const responseTime = Date.now() - startTime
          metadata['responseTime'] = responseTime
          metadata['error'] = 'WebSocket connection failed'
          resolve('down')
        }
      })
    } catch (error) {
      metadata['error'] = error instanceof Error ? error.message : 'Connection failed'
      return 'down'
    }
  }

  /**
   * Check Database service status
   */
  private async checkDatabaseService(
    metadata: Record<string, unknown>
  ): Promise<'up' | 'down' | 'degraded'> {
    try {
      const startTime = Date.now()
      const response = await fetch('http://localhost:2113/health')
      const responseTime = Date.now() - startTime

      metadata['responseTime'] = responseTime

      if (response.ok) {
        if (responseTime <= 50) {
          metadata['performanceGrade'] = 'excellent'
          return 'up'
        } else if (responseTime <= 100) {
          metadata['performanceGrade'] = 'good'
          return 'up'
        } else if (responseTime <= 500) {
          metadata['performanceGrade'] = 'acceptable'
          return 'up'
        } else {
          metadata['performanceGrade'] = 'slow'
          return 'degraded'
        }
      } else {
        metadata['error'] = `HTTP ${response.status}`
        return 'degraded' // Changed from 'down' to 'degraded' for non-200 responses
      }
    } catch (error) {
      metadata['error'] = error instanceof Error ? error.message : 'Connection failed'
      return 'degraded' // Changed from 'down' to 'degraded' for connection failures
    }
  }

  /**
   * Load uptime data from KurrentDB streams
   */
  private async loadUptimeDataFromDB(): Promise<void> {
    try {
      const services = ['http', 'websocket', 'database']

      for (const serviceName of services) {
        const streamName = `${this.STREAM_PREFIX}-${serviceName}`

        try {
          const events = await this.kurrentDBService.readStream(streamName, {
            maxCount: this.MAX_RECORDS_PER_SERVICE,
            direction: BACKWARDS,
          })

          const records: ServiceUptimeRecord[] = events.map(event => ({
            id: event.id,
            serviceName: event.data['serviceName'] as string,
            status: event.data['status'] as 'up' | 'down' | 'degraded',
            timestamp: new Date(event.data['timestamp'] as string),
            duration: event.data['duration'] as number,
            metadata: event.data['metadata'] as Record<string, unknown>,
          }))

          if (records.length > 0) {
            this.uptimeRecords.set(serviceName, records)

            // Set current status and last status change
            const lastRecord = records[records.length - 1]
            if (lastRecord) {
              this.currentStatuses.set(serviceName, lastRecord.status)
              this.lastStatusChange.set(serviceName, lastRecord.timestamp)
            }

            // Set service start time
            const firstRecord = records[0]
            if (firstRecord) {
              this.serviceStartTimes.set(serviceName, firstRecord.timestamp)
            }

            logger.info(`Loaded ${records.length} uptime records for ${serviceName} from KurrentDB`)

            // Initialize the last read position for this stream
            if (events.length > 0) {
              const lastEvent = events[events.length - 1]
              if (lastEvent && typeof lastEvent.position === 'number') {
                this.lastReadPositions.set(streamName, lastEvent.position)
              }
            }
          }
        } catch (error) {
          logger.warn(`Failed to load uptime data for ${serviceName}:`, error)
        }
      }
    } catch (error) {
      logger.error('Failed to load uptime data from KurrentDB:', error)
    }
  }

  /**
   * Read new events from KurrentDB streams since last read position
   */
  private async readNewStreamEvents(): Promise<void> {
    try {
      const services = ['http', 'websocket', 'database']

      for (const serviceName of services) {
        const streamName = `${this.STREAM_PREFIX}-${serviceName}`
        const lastPosition = this.lastReadPositions.get(streamName) || 0

        try {
          // Check if this stream is in error backoff
          const errorCount = this.streamErrorCounts.get(streamName) || 0
          if (errorCount >= this.MAX_STREAM_ERRORS) {
            logger.debug(`Skipping ${streamName} due to error backoff (${errorCount} errors)`)
            continue
          }

          // Read events from the last known position
          const events = await this.kurrentDBService.readStream(streamName, {
            fromRevision: lastPosition + 1, // Start from next position
            maxCount: 100, // Read up to 100 new events
            direction: FORWARDS, // Read forwards from the position
          })

          if (events.length > 0) {
            logger.debug(`Read ${events.length} new events from ${streamName}`)

            // Process each new event
            for (const event of events) {
              await this.processStreamEvent(serviceName, event)
            }

            // Update the last read position
            const lastEvent = events[events.length - 1]
            if (lastEvent && typeof lastEvent.position === 'number') {
              this.lastReadPositions.set(streamName, lastEvent.position)
            }
          }

          // Reset error count on successful read
          if (errorCount > 0) {
            this.streamErrorCounts.set(streamName, 0)
            logger.info(`Stream ${streamName} recovered from errors`)
          }
        } catch (error) {
          const newErrorCount = (this.streamErrorCounts.get(streamName) || 0) + 1
          this.streamErrorCounts.set(streamName, newErrorCount)

          if (newErrorCount >= this.MAX_STREAM_ERRORS) {
            logger.error(
              `Stream ${streamName} has ${newErrorCount} consecutive errors, entering backoff period`
            )
          } else {
            logger.warn(
              `Failed to read new events from ${streamName} (${newErrorCount}/${this.MAX_STREAM_ERRORS}):`,
              error
            )
          }
        }
      }
    } catch (error) {
      logger.error('Error reading new stream events:', error)
    }
  }

  /**
   * Process a single event from a KurrentDB stream
   */
  private async processStreamEvent(serviceName: string, event: KurrentDBEvent): Promise<void> {
    try {
      // Only process service status change events
      if (event.type !== 'service_status_change') {
        return
      }

      const eventData = event.data
      if (
        !eventData ||
        !eventData['serviceName'] ||
        !eventData['status'] ||
        !eventData['timestamp']
      ) {
        logger.warn(`Invalid event data for ${serviceName}:`, eventData)
        return
      }

      // Create a new uptime record from the stream event
      const newRecord: ServiceUptimeRecord = {
        id: (eventData['id'] as string) || event.id,
        serviceName: eventData['serviceName'] as string,
        status: eventData['status'] as 'up' | 'down' | 'degraded',
        timestamp: new Date(eventData['timestamp'] as string),
        duration: eventData['duration'] as number,
        metadata: eventData['metadata'] as {
          responseTime?: number
          error?: string
          performanceGrade?: string
        },
      }

      // Update local state with the new record
      await this.updateLocalStateFromStreamEvent(newRecord)

      logger.debug(
        `Processed stream event for ${serviceName}: ${eventData['status']} at ${eventData['timestamp']}`
      )
    } catch (error) {
      logger.error(`Error processing stream event for ${serviceName}:`, error)
    }
  }

  /**
   * Update local state based on a stream event
   */
  private async updateLocalStateFromStreamEvent(record: ServiceUptimeRecord): Promise<void> {
    const serviceName = record.serviceName
    const records = this.uptimeRecords.get(serviceName) || []

    // Check if this record already exists (avoid duplicates)
    const existingRecord = records.find(r => r.id === record.id)
    if (existingRecord) {
      return // Skip duplicate
    }

    // Add the new record
    records.push(record)

    // Keep only the last MAX_RECORDS_PER_SERVICE records
    if (records.length > this.MAX_RECORDS_PER_SERVICE) {
      records.splice(0, records.length - this.MAX_RECORDS_PER_SERVICE)
    }

    this.uptimeRecords.set(serviceName, records)

    // Update current status and last status change
    this.currentStatuses.set(serviceName, record.status)
    this.lastStatusChange.set(serviceName, record.timestamp)

    // Initialize service start time if not set
    if (!this.serviceStartTimes.has(serviceName)) {
      this.serviceStartTimes.set(serviceName, record.timestamp)
    }

    logger.info(`Updated local state from stream: ${serviceName} is now ${record.status}`)
  }

  /**
   * Save uptime record to KurrentDB stream
   */
  private async saveUptimeRecordToDB(record: ServiceUptimeRecord): Promise<void> {
    try {
      // Validate record has required fields
      if (!record.timestamp || !record.serviceName) {
        logger.error(`Invalid record data:`, {
          serviceName: record.serviceName,
          timestamp: record.timestamp,
          record,
        })
        return
      }

      const streamName = `${this.STREAM_PREFIX}-${record.serviceName}`

      await this.kurrentDBService.appendToStream(streamName, {
        type: 'service_status_change',
        data: {
          id: record.id,
          serviceName: record.serviceName,
          status: record.status,
          timestamp: record.timestamp.toISOString(),
          duration: record.duration,
          metadata: record.metadata,
        },
        metadata: {
          service: record.serviceName,
          status: record.status,
          timestamp: record.timestamp.toISOString(),
        },
      })
    } catch (error) {
      logger.error(`Failed to save uptime record for ${record.serviceName}:`, error)
    }
  }

  /**
   * Record a status change for a service
   */
  private recordStatusChange(
    serviceName: string,
    status: 'up' | 'down' | 'degraded',
    timestamp: Date,
    metadata: Record<string, unknown>
  ): void {
    const records = this.uptimeRecords.get(serviceName) || []

    // Calculate duration for the previous status
    if (records.length > 0) {
      const lastRecord = records[records.length - 1]
      if (lastRecord) {
        const duration = timestamp.getTime() - lastRecord.timestamp.getTime()
        lastRecord.duration = duration

        // Save the previous record to DB
        this.saveUptimeRecordToDB(lastRecord).catch(error => {
          logger.error(`Failed to save previous record for ${serviceName}:`, error)
        })
      }
    }

    // Create new record with minimal data structure
    const newRecord: ServiceUptimeRecord = {
      id: `${serviceName}_${timestamp.getTime()}`,
      serviceName,
      status,
      timestamp,
      ...(metadata && {
        metadata: {
          responseTime: metadata['responseTime'] as number,
          error: metadata['error'] as string,
          performanceGrade: metadata['performanceGrade'] as string,
        },
      }),
    }

    records.push(newRecord)

    // Keep only the last MAX_RECORDS_PER_SERVICE records
    if (records.length > this.MAX_RECORDS_PER_SERVICE) {
      records.splice(0, records.length - this.MAX_RECORDS_PER_SERVICE)
    }

    this.uptimeRecords.set(serviceName, records)

    // Save the new record to DB
    this.saveUptimeRecordToDB(newRecord).catch(error => {
      logger.error(`Failed to save new record for ${serviceName}:`, error)
    })

    // Only log status changes, not every check
    if (records.length > 1) {
      const previousRecord = records[records.length - 2]
      if (previousRecord && previousRecord.status !== status) {
        logger.info(
          `Service ${serviceName} status changed from ${previousRecord.status} to ${status}`
        )
      }
    }
  }

  /**
   * Get uptime timeline for a specific service
   */
  public getServiceUptimeTimeline(
    serviceName: string,
    hours: number = 24
  ): ServiceUptimeTimeline | null {
    const records = this.uptimeRecords.get(serviceName)
    if (!records || records.length === 0) {
      return null
    }

    // Handle special case for "all time" (use -1 or very large number)
    let filteredRecords: ServiceUptimeRecord[]
    if (hours === -1 || hours > 8760) {
      // -1 or more than 1 year (8760 hours)
      // All time - use all records
      filteredRecords = records
    } else {
      // Convert hours to milliseconds (support fractional hours like 0.5 for 30 minutes)
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)
      filteredRecords = records.filter(record => record.timestamp >= cutoffTime)
    }

    if (filteredRecords.length === 0) {
      return null
    }

    // Filter out records with null timestamps
    const validRecords = filteredRecords.filter(record => record.timestamp)

    if (validRecords.length === 0) {
      return null
    }

    const startTime = validRecords[0]?.timestamp
    const endTime = validRecords[validRecords.length - 1]?.timestamp

    // Ensure we have valid timestamps
    if (!startTime || !endTime) {
      return null
    }

    const currentStatus = this.currentStatuses.get(serviceName) || 'down'
    const lastStatusChange = this.lastStatusChange.get(serviceName) || startTime

    // Calculate total uptime and downtime
    let totalUptime = 0
    let totalDowntime = 0

    // Process each record to calculate durations
    for (let i = 0; i < validRecords.length; i++) {
      const record = validRecords[i]
      if (!record) continue

      let recordDuration = 0

      if (record.duration) {
        // Record has explicit duration
        recordDuration = record.duration
      } else {
        // Record has no duration - calculate from next record or current time
        const nextRecord = validRecords[i + 1]
        const recordEndTime = nextRecord ? nextRecord.timestamp : new Date()
        recordDuration = recordEndTime.getTime() - record.timestamp.getTime()
      }

      // Ensure duration is valid and positive
      if (recordDuration > 0 && !isNaN(recordDuration)) {
        if (record.status === 'up') {
          totalUptime += recordDuration
        } else {
          totalDowntime += recordDuration
        }
      }
    }

    const totalTime = totalUptime + totalDowntime
    const uptimePercentage = totalTime > 0 ? (totalUptime / totalTime) * 100 : 0

    // Debug logging for WebSocket service
    if (serviceName === 'websocket') {
      logger.info(
        `WebSocket uptime calculation: totalUptime=${totalUptime}, totalDowntime=${totalDowntime}, totalTime=${totalTime}, percentage=${uptimePercentage}, validRecords=${validRecords.length}`
      )
    }

    return {
      serviceName,
      totalUptime,
      totalDowntime,
      uptimePercentage,
      currentStatus,
      lastStatusChange,
      timeline: validRecords,
      startTime,
      endTime,
    }
  }

  /**
   * Get uptime summary for a specific service
   */
  public getServiceUptimeSummary(
    serviceName: string,
    hours: number = 24
  ): ServiceUptimeSummary | null {
    const timeline = this.getServiceUptimeTimeline(serviceName, hours)
    if (!timeline) {
      return null
    }

    return {
      serviceName,
      currentStatus: timeline.currentStatus,
      uptimePercentage: timeline.uptimePercentage,
      totalUptime: this.formatDuration(timeline.totalUptime),
      totalDowntime: this.formatDuration(timeline.totalDowntime),
      lastStatusChange: timeline.lastStatusChange,
      isCurrentlyUp: timeline.currentStatus === 'up',
    }
  }

  /**
   * Get uptime summaries for all services
   */
  public getAllServiceUptimeSummaries(hours: number = 24): ServiceUptimeSummary[] {
    const services = ['http', 'websocket', 'database']
    const summaries: ServiceUptimeSummary[] = []

    services.forEach(serviceName => {
      const summary = this.getServiceUptimeSummary(serviceName, hours)
      if (summary) {
        summaries.push(summary)
      }
    })

    return summaries
  }

  /**
   * Format duration in milliseconds to human-readable string
   */
  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  /**
   * Get current status of all services
   */
  public getCurrentServiceStatuses(): Record<string, 'up' | 'down' | 'degraded'> {
    const statuses: Record<string, 'up' | 'down' | 'degraded'> = {}
    this.currentStatuses.forEach((status, serviceName) => {
      statuses[serviceName] = status
    })
    return statuses
  }

  /**
   * Create initial streams for uptime tracking
   */
  private async createUptimeStreams(): Promise<void> {
    try {
      const services = ['http', 'websocket', 'database']

      for (const serviceName of services) {
        const streamName = `${this.STREAM_PREFIX}-${serviceName}`

        try {
          await this.kurrentDBService.createStream({
            name: streamName,
            description: `Service uptime tracking for ${serviceName}`,
            data: {},
            tags: ['uptime', 'monitoring', serviceName],
            owner: 'system',
          })

          logger.info(`Created uptime stream for ${serviceName}`)
        } catch (error) {
          // Stream might already exist, which is fine
          logger.debug(`Stream ${streamName} might already exist:`, error)
        }
      }
    } catch (error) {
      logger.error('Failed to create uptime streams:', error)
    }
  }

  /**
   * Clear all uptime data (useful for testing or reset)
   */
  public clearAllData(): void {
    this.uptimeRecords.clear()
    this.serviceStartTimes.clear()
    this.currentStatuses.clear()
    this.lastStatusChange.clear()
    this.lastReadPositions.clear()
    this.streamErrorCounts.clear()
    logger.info('All uptime tracking data cleared')
  }

  /**
   * Reset error counts for all streams (useful for recovery)
   */
  public resetStreamErrorCounts(): void {
    this.streamErrorCounts.clear()
    logger.info('Stream error counts reset')
  }

  /**
   * Graceful shutdown - record all services as down
   */
  private async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down uptime tracking service...')

      // Stop all intervals
      if (this.trackingInterval) {
        clearInterval(this.trackingInterval)
        this.trackingInterval = null
      }

      if (this.streamReadingInterval) {
        clearInterval(this.streamReadingInterval)
        this.streamReadingInterval = null
      }

      // Record all services as down
      const timestamp = new Date()
      const services = ['http', 'websocket', 'database']

      for (const serviceName of services) {
        const currentStatus = this.currentStatuses.get(serviceName)
        if (currentStatus && currentStatus !== 'down') {
          // Only record if service was not already down
          this.recordStatusChange(serviceName, 'down', timestamp, {
            reason: 'Service shutdown',
            shutdown: true,
          })
          logger.info(`Recorded ${serviceName} service as down due to shutdown`)
        }
      }

      // Wait a moment for records to be saved
      await new Promise(resolve => setTimeout(resolve, 1000))

      logger.info('Uptime tracking service shutdown complete')
    } catch (error) {
      logger.error('Error during shutdown:', error)
    }
  }

  /**
   * Get memory usage statistics for monitoring
   */
  public getMemoryStats(): {
    totalRecords: number
    recordsPerService: Record<string, number>
    memoryEstimate: string
  } {
    let totalRecords = 0
    const recordsPerService: Record<string, number> = {}

    this.uptimeRecords.forEach((records, serviceName) => {
      const count = records.length
      recordsPerService[serviceName] = count
      totalRecords += count
    })

    // Rough estimate: each record is ~200 bytes
    const memoryEstimateBytes = totalRecords * 200
    const memoryEstimate =
      memoryEstimateBytes < 1024
        ? `${memoryEstimateBytes} B`
        : memoryEstimateBytes < 1024 * 1024
          ? `${Math.round(memoryEstimateBytes / 1024)} KB`
          : `${Math.round(memoryEstimateBytes / (1024 * 1024))} MB`

    return {
      totalRecords,
      recordsPerService,
      memoryEstimate,
    }
  }
}

// Export singleton instance
export const uptimeTrackingService = new UptimeTrackingService()
