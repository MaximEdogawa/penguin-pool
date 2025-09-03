import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { KurrentDBService } from '../services/kurrentdb.service'
import {
  ServiceUptimeRecord,
  ServiceUptimeTimeline,
  ServiceUptimeSummary,
} from '../entities/uptime.entity'
import { WebSocket } from 'ws'
import { BACKWARDS, FORWARDS } from '@kurrent/kurrentdb-client'

@Injectable()
export class UptimeTrackingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UptimeTrackingService.name)
  private uptimeRecords: Map<string, ServiceUptimeRecord[]> = new Map()
  private serviceStartTimes: Map<string, Date> = new Map()
  private currentStatuses: Map<string, 'up' | 'down' | 'degraded'> = new Map()
  private lastStatusChange: Map<string, Date> = new Map()
  private trackingInterval: NodeJS.Timeout | null = null
  private streamReadingInterval: NodeJS.Timeout | null = null
  private readonly TRACKING_INTERVAL = 30000 // 30 seconds
  private readonly STREAM_READING_INTERVAL = 10000 // 10 seconds
  private readonly MAX_RECORDS_PER_SERVICE = 1000
  private readonly CLEANUP_INTERVAL = 3600000 // 1 hour
  private readonly MAX_AGE_HOURS = 168 // 7 days
  private readonly STREAM_PREFIX = 'service-uptime'
  private lastReadPositions: Map<string, number> = new Map()
  private streamErrorCounts: Map<string, number> = new Map()
  private readonly MAX_STREAM_ERRORS = 5

  constructor(private readonly kurrentDBService: KurrentDBService) {}

  async onModuleInit() {
    try {
      await this.createUptimeStreams()
      await this.loadUptimeDataFromDB()
      this.startTracking()
      this.startStreamReading()
      this.startCleanup()

      this.logger.log(
        'Uptime tracking service initialized with KurrentDB persistence and stream reading'
      )
    } catch (error) {
      this.logger.error('Failed to initialize uptime tracking service:', error)
      this.startTracking()
      this.startCleanup()
    }
  }

  async onModuleDestroy() {
    await this.shutdown()
  }

  private startTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval)
    }

    this.trackingInterval = setInterval(() => {
      this.recordServiceStatus()
    }, this.TRACKING_INTERVAL)

    this.logger.log('Service uptime tracking started')
  }

  private startStreamReading(): void {
    if (this.streamReadingInterval) {
      clearInterval(this.streamReadingInterval)
    }

    this.streamReadingInterval = setInterval(() => {
      this.readNewStreamEvents()
    }, this.STREAM_READING_INTERVAL)

    this.logger.log('Stream reading started for real-time uptime updates')
  }

  private startCleanup(): void {
    setInterval(() => {
      this.cleanupOldRecords()
    }, this.CLEANUP_INTERVAL)

    this.logger.log('Automatic cleanup started')
  }

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
      this.logger.log(`Cleaned up ${totalRemoved} old uptime records`)
    }
  }

  private async recordServiceStatus(): Promise<void> {
    const timestamp = new Date()

    try {
      await this.checkAndRecordServiceStatus('http', timestamp)
      await this.checkAndRecordServiceStatus('websocket', timestamp)
      await this.checkAndRecordServiceStatus('database', timestamp)
    } catch (error) {
      this.logger.error('Error recording service status:', error)
    }
  }

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

      const currentStatus = this.currentStatuses.get(serviceName)
      if (currentStatus !== status) {
        this.recordStatusChange(serviceName, status, timestamp, metadata)
        this.currentStatuses.set(serviceName, status)
        this.lastStatusChange.set(serviceName, timestamp)
      }

      if (!this.serviceStartTimes.has(serviceName)) {
        this.serviceStartTimes.set(serviceName, timestamp)
      }
    } catch (error) {
      this.logger.error(`Error checking ${serviceName} service:`, error)
      this.recordStatusChange(serviceName, 'down', timestamp, {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

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

  private async checkWebSocketService(
    metadata: Record<string, unknown>
  ): Promise<'up' | 'down' | 'degraded'> {
    try {
      const startTime = Date.now()
      const wsPort = process.env['HTTP_PORT'] || '3001'
      const ws = new WebSocket(`ws://localhost:${wsPort}/ws/health`)

      return new Promise(resolve => {
        const timeout = setTimeout(() => {
          ws.close()
          const responseTime = Date.now() - startTime
          metadata['responseTime'] = responseTime
          metadata['error'] = 'WebSocket connection timeout'
          resolve('down')
        }, 2000)

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

  private async checkDatabaseService(
    metadata: Record<string, unknown>
  ): Promise<'up' | 'down' | 'degraded'> {
    try {
      const startTime = Date.now()
      const response = await fetch('http://localhost:3002/health/kurrentdb')
      const responseTime = Date.now() - startTime

      metadata['responseTime'] = responseTime

      if (response.ok) {
        const healthData = (await response.json()) as {
          status: string
          connected: boolean
        }

        if (healthData.status === 'healthy' && healthData.connected) {
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
          metadata['error'] = `Database not healthy: ${healthData.status}`
          return 'degraded'
        }
      } else {
        metadata['error'] = `HTTP ${response.status}`
        return 'degraded'
      }
    } catch (error) {
      metadata['error'] = error instanceof Error ? error.message : 'Connection failed'
      return 'degraded'
    }
  }

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

            const lastRecord = records[records.length - 1]
            if (lastRecord) {
              this.currentStatuses.set(serviceName, lastRecord.status)
              this.lastStatusChange.set(serviceName, lastRecord.timestamp)
            }

            const firstRecord = records[0]
            if (firstRecord) {
              this.serviceStartTimes.set(serviceName, firstRecord.timestamp)
            }

            this.logger.log(
              `Loaded ${records.length} uptime records for ${serviceName} from KurrentDB`
            )

            if (events.length > 0) {
              const lastEvent = events[events.length - 1]
              if (lastEvent && typeof lastEvent.position === 'number') {
                this.lastReadPositions.set(streamName, lastEvent.position)
              }
            }
          }
        } catch (error) {
          this.logger.warn(`Failed to load uptime data for ${serviceName}:`, error)
        }
      }
    } catch (error) {
      this.logger.error('Failed to load uptime data from KurrentDB:', error)
    }
  }

  private async readNewStreamEvents(): Promise<void> {
    try {
      const services = ['http', 'websocket', 'database']

      for (const serviceName of services) {
        const streamName = `${this.STREAM_PREFIX}-${serviceName}`
        const lastPosition = this.lastReadPositions.get(streamName) || 0

        try {
          const errorCount = this.streamErrorCounts.get(streamName) || 0
          if (errorCount >= this.MAX_STREAM_ERRORS) {
            this.logger.debug(`Skipping ${streamName} due to error backoff (${errorCount} errors)`)
            continue
          }

          const events = await this.kurrentDBService.readStream(streamName, {
            fromRevision: lastPosition + 1,
            maxCount: 100,
            direction: FORWARDS,
          })

          if (events.length > 0) {
            this.logger.debug(`Read ${events.length} new events from ${streamName}`)

            for (const event of events) {
              await this.processStreamEvent(serviceName, event)
            }

            const lastEvent = events[events.length - 1]
            if (lastEvent && typeof lastEvent.position === 'number') {
              this.lastReadPositions.set(streamName, lastEvent.position)
            }
          }

          if (errorCount > 0) {
            this.streamErrorCounts.set(streamName, 0)
            this.logger.log(`Stream ${streamName} recovered from errors`)
          }
        } catch (error) {
          const newErrorCount = (this.streamErrorCounts.get(streamName) || 0) + 1
          this.streamErrorCounts.set(streamName, newErrorCount)

          if (newErrorCount >= this.MAX_STREAM_ERRORS) {
            this.logger.error(
              `Stream ${streamName} has ${newErrorCount} consecutive errors, entering backoff period`
            )
          } else {
            this.logger.warn(
              `Failed to read new events from ${streamName} (${newErrorCount}/${this.MAX_STREAM_ERRORS}):`,
              error
            )
          }
        }
      }
    } catch (error) {
      this.logger.error('Error reading new stream events:', error)
    }
  }

  private async processStreamEvent(
    serviceName: string,
    event: {
      id: string
      type: string
      data: Record<string, unknown>
      metadata: Record<string, unknown>
      position: number
      revision: bigint
      timestamp: string
      streamId: string
    }
  ): Promise<void> {
    try {
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
        this.logger.warn(`Invalid event data for ${serviceName}:`, eventData)
        return
      }

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

      await this.updateLocalStateFromStreamEvent(newRecord)

      this.logger.debug(
        `Processed stream event for ${serviceName}: ${eventData['status']} at ${eventData['timestamp']}`
      )
    } catch (error) {
      this.logger.error(`Error processing stream event for ${serviceName}:`, error)
    }
  }

  private async updateLocalStateFromStreamEvent(record: ServiceUptimeRecord): Promise<void> {
    const serviceName = record.serviceName
    const records = this.uptimeRecords.get(serviceName) || []

    const existingRecord = records.find(r => r.id === record.id)
    if (existingRecord) {
      return
    }

    records.push(record)

    if (records.length > this.MAX_RECORDS_PER_SERVICE) {
      records.splice(0, records.length - this.MAX_RECORDS_PER_SERVICE)
    }

    this.uptimeRecords.set(serviceName, records)
    this.currentStatuses.set(serviceName, record.status)
    this.lastStatusChange.set(serviceName, record.timestamp)

    if (!this.serviceStartTimes.has(serviceName)) {
      this.serviceStartTimes.set(serviceName, record.timestamp)
    }

    this.logger.log(`Updated local state from stream: ${serviceName} is now ${record.status}`)
  }

  private async saveUptimeRecordToDB(record: ServiceUptimeRecord): Promise<void> {
    try {
      if (!record.timestamp || !record.serviceName) {
        this.logger.error(`Invalid record data:`, {
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
      this.logger.error(`Failed to save uptime record for ${record.serviceName}:`, error)
    }
  }

  private recordStatusChange(
    serviceName: string,
    status: 'up' | 'down' | 'degraded',
    timestamp: Date,
    metadata: Record<string, unknown>
  ): void {
    const records = this.uptimeRecords.get(serviceName) || []

    if (records.length > 0) {
      const lastRecord = records[records.length - 1]
      if (lastRecord) {
        const duration = timestamp.getTime() - lastRecord.timestamp.getTime()
        lastRecord.duration = duration

        this.saveUptimeRecordToDB(lastRecord).catch(error => {
          this.logger.error(`Failed to save previous record for ${serviceName}:`, error)
        })
      }
    }

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

    if (records.length > this.MAX_RECORDS_PER_SERVICE) {
      records.splice(0, records.length - this.MAX_RECORDS_PER_SERVICE)
    }

    this.uptimeRecords.set(serviceName, records)

    this.saveUptimeRecordToDB(newRecord).catch(error => {
      this.logger.error(`Failed to save new record for ${serviceName}:`, error)
    })

    if (records.length > 1) {
      const previousRecord = records[records.length - 2]
      if (previousRecord && previousRecord.status !== status) {
        this.logger.log(
          `Service ${serviceName} status changed from ${previousRecord.status} to ${status}`
        )
      }
    }
  }

  public getServiceUptimeTimeline(
    serviceName: string,
    hours: number = 24
  ): ServiceUptimeTimeline | null {
    const records = this.uptimeRecords.get(serviceName)
    if (!records || records.length === 0) {
      return null
    }

    let filteredRecords: ServiceUptimeRecord[]
    if (hours === -1 || hours > 8760) {
      filteredRecords = records
    } else {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)
      filteredRecords = records.filter(record => record.timestamp >= cutoffTime)
    }

    if (filteredRecords.length === 0) {
      return null
    }

    const validRecords = filteredRecords.filter(record => record.timestamp)

    if (validRecords.length === 0) {
      return null
    }

    const startTime = validRecords[0]?.timestamp
    const endTime = validRecords[validRecords.length - 1]?.timestamp

    if (!startTime || !endTime) {
      return null
    }

    const currentStatus = this.currentStatuses.get(serviceName) || 'down'
    const lastStatusChange = this.lastStatusChange.get(serviceName) || startTime

    let totalUptime = 0
    let totalDowntime = 0

    for (let i = 0; i < validRecords.length; i++) {
      const record = validRecords[i]
      if (!record) continue

      let recordDuration = 0

      if (record.duration) {
        recordDuration = record.duration
      } else {
        const nextRecord = validRecords[i + 1]
        const recordEndTime = nextRecord ? nextRecord.timestamp : new Date()
        recordDuration = recordEndTime.getTime() - record.timestamp.getTime()
      }

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

  public getCurrentServiceStatuses(): Record<string, 'up' | 'down' | 'degraded'> {
    const statuses: Record<string, 'up' | 'down' | 'degraded'> = {}
    this.currentStatuses.forEach((status, serviceName) => {
      statuses[serviceName] = status
    })
    return statuses
  }

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

          this.logger.log(`Created uptime stream for ${serviceName}`)
        } catch (error) {
          this.logger.debug(`Stream ${streamName} might already exist:`, error)
        }
      }
    } catch (error) {
      this.logger.error('Failed to create uptime streams:', error)
    }
  }

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

  private async shutdown(): Promise<void> {
    try {
      this.logger.log('Shutting down uptime tracking service...')

      if (this.trackingInterval) {
        clearInterval(this.trackingInterval)
        this.trackingInterval = null
      }

      if (this.streamReadingInterval) {
        clearInterval(this.streamReadingInterval)
        this.streamReadingInterval = null
      }

      const timestamp = new Date()
      const services = ['http', 'websocket', 'database']

      for (const serviceName of services) {
        const currentStatus = this.currentStatuses.get(serviceName)
        if (currentStatus && currentStatus !== 'down') {
          this.recordStatusChange(serviceName, 'down', timestamp, {
            reason: 'Service shutdown',
            shutdown: true,
          })
          this.logger.log(`Recorded ${serviceName} service as down due to shutdown`)
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000))

      this.logger.log('Uptime tracking service shutdown complete')
    } catch (error) {
      this.logger.error('Error during shutdown:', error)
    }
  }
}
