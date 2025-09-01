import { KurrentDBService } from './KurrentDBService'
import { createLogger } from 'winston'
import { format, transports } from 'winston'
import { FORWARDS, NO_STREAM } from '@kurrent/kurrentdb-client'

const logger = createLogger({
  level: 'info',
  format: format.simple(),
  transports: [new transports.Console()],
})

export interface StreamEvent {
  id: string
  type: string
  data: Record<string, unknown>
  metadata: Record<string, unknown>
  position: number
  revision: bigint
  timestamp: string
  streamId: string
}

export interface StreamInfo {
  name: string
  eventCount: number
  lastEvent?:
    | {
        id: string
        type: string
        timestamp: string
      }
    | undefined
  firstEvent?:
    | {
        id: string
        type: string
        timestamp: string
      }
    | undefined
  size: number
  created: string
  updated: string
}

export interface StreamBrowserOptions {
  limit?: number
  offset?: number
  filter?: {
    namePattern?: string
    eventType?: string
    dateRange?: {
      from: string
      to: string
    }
  }
}

export interface StreamSearchResult {
  streams: StreamInfo[]
  total: number
  hasMore: boolean
}

export class StreamManagementService {
  private kurrentDBService: KurrentDBService

  constructor() {
    this.kurrentDBService = new KurrentDBService()
  }

  /**
   * Browse all streams with pagination and filtering
   */
  async browseStreams(options: StreamBrowserOptions = {}): Promise<StreamSearchResult> {
    try {
      logger.info('Browsing streams with options:', options)

      // Read from $all stream to discover all streams
      const allEvents = await this.kurrentDBService.readAll({
        maxCount: 10000, // Large limit to get all events
        direction: FORWARDS,
      })

      // Group events by stream
      const streamMap = new Map<string, StreamEvent[]>()

      for (const event of allEvents) {
        const streamName = event.streamId
        if (!streamMap.has(streamName)) {
          streamMap.set(streamName, [])
        }
        streamMap.get(streamName)!.push(event)
      }

      // Convert to StreamInfo objects
      const streams: StreamInfo[] = []

      for (const [streamName, events] of streamMap) {
        if (events.length === 0) continue

        // Sort events by timestamp
        events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

        const firstEvent = events[0]
        const lastEvent = events[events.length - 1]

        // Calculate size (approximate)
        const size = events.reduce((acc, event) => {
          return acc + JSON.stringify(event).length
        }, 0)

        const streamInfo: StreamInfo = {
          name: streamName,
          eventCount: events.length,
          firstEvent: firstEvent
            ? {
                id: firstEvent.id,
                type: firstEvent.type,
                timestamp: firstEvent.timestamp,
              }
            : undefined,
          lastEvent: lastEvent
            ? {
                id: lastEvent.id,
                type: lastEvent.type,
                timestamp: lastEvent.timestamp,
              }
            : undefined,
          size,
          created: firstEvent?.timestamp || new Date().toISOString(),
          updated: lastEvent?.timestamp || new Date().toISOString(),
        }

        streams.push(streamInfo)
      }

      // Apply filters
      let filteredStreams = streams

      if (options.filter) {
        if (options.filter.namePattern) {
          const pattern = new RegExp(options.filter.namePattern, 'i')
          filteredStreams = filteredStreams.filter(stream => pattern.test(stream.name))
        }

        if (options.filter.eventType) {
          filteredStreams = filteredStreams.filter(
            stream => stream.lastEvent?.type === options.filter!.eventType
          )
        }

        if (options.filter.dateRange) {
          const fromDate = new Date(options.filter.dateRange.from)
          const toDate = new Date(options.filter.dateRange.to)

          filteredStreams = filteredStreams.filter(stream => {
            const streamDate = new Date(stream.updated)
            return streamDate >= fromDate && streamDate <= toDate
          })
        }
      }

      // Sort by updated date (newest first)
      filteredStreams.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())

      // Apply pagination
      const limit = options.limit || 50
      const offset = options.offset || 0
      const paginatedStreams = filteredStreams.slice(offset, offset + limit)

      return {
        streams: paginatedStreams,
        total: filteredStreams.length,
        hasMore: offset + limit < filteredStreams.length,
      }
    } catch (error) {
      logger.error('Failed to browse streams:', error)
      throw error
    }
  }

  /**
   * Get detailed information about a specific stream
   */
  async getStreamDetails(streamName: string): Promise<{
    info: StreamInfo
    events: StreamEvent[]
    statistics: {
      eventTypes: Record<string, number>
      averageEventSize: number
      eventsPerDay: Record<string, number>
    }
  }> {
    try {
      logger.info(`Getting details for stream: ${streamName}`)

      // Read all events from the stream
      const events = await this.kurrentDBService.readStream(streamName, {
        maxCount: 10000,
        direction: FORWARDS,
      })

      if (events.length === 0) {
        throw new Error(`Stream ${streamName} not found or empty`)
      }

      // Sort events by timestamp
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

      const firstEvent = events[0]
      const lastEvent = events[events.length - 1]

      // Calculate size
      const size = events.reduce((acc, event) => {
        return acc + JSON.stringify(event).length
      }, 0)

      const streamInfo: StreamInfo = {
        name: streamName,
        eventCount: events.length,
        firstEvent: firstEvent
          ? {
              id: firstEvent.id,
              type: firstEvent.type,
              timestamp: firstEvent.timestamp,
            }
          : undefined,
        lastEvent: lastEvent
          ? {
              id: lastEvent.id,
              type: lastEvent.type,
              timestamp: lastEvent.timestamp,
            }
          : undefined,
        size,
        created: firstEvent?.timestamp || new Date().toISOString(),
        updated: lastEvent?.timestamp || new Date().toISOString(),
      }

      // Calculate statistics
      const eventTypes: Record<string, number> = {}
      let totalEventSize = 0
      const eventsPerDay: Record<string, number> = {}

      for (const event of events) {
        // Count event types
        eventTypes[event.type] = (eventTypes[event.type] || 0) + 1

        // Calculate event size
        totalEventSize += JSON.stringify(event).length

        // Count events per day
        const date = new Date(event.timestamp).toISOString().split('T')[0]
        if (date) {
          eventsPerDay[date] = (eventsPerDay[date] || 0) + 1
        }
      }

      const statistics = {
        eventTypes,
        averageEventSize: Math.round(totalEventSize / events.length),
        eventsPerDay,
      }

      return {
        info: streamInfo,
        events,
        statistics,
      }
    } catch (error) {
      logger.error(`Failed to get stream details for ${streamName}:`, error)
      throw error
    }
  }

  /**
   * Search for events across all streams
   */
  async searchEvents(query: {
    text?: string
    eventType?: string
    streamName?: string
    dateRange?: {
      from: string
      to: string
    }
    limit?: number
  }): Promise<{
    events: StreamEvent[]
    total: number
    streams: string[]
  }> {
    try {
      logger.info('Searching events with query:', query)

      // Read from $all stream
      const allEvents = await this.kurrentDBService.readAll({
        maxCount: 10000,
        direction: FORWARDS,
      })

      let filteredEvents = allEvents

      // Apply filters
      if (query.eventType) {
        filteredEvents = filteredEvents.filter(event => event.type === query.eventType)
      }

      if (query.streamName) {
        filteredEvents = filteredEvents.filter(event => event.streamId === query.streamName)
      }

      if (query.dateRange) {
        const fromDate = new Date(query.dateRange.from)
        const toDate = new Date(query.dateRange.to)

        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.timestamp)
          return eventDate >= fromDate && eventDate <= toDate
        })
      }

      if (query.text) {
        const searchText = query.text.toLowerCase()
        filteredEvents = filteredEvents.filter(event => {
          const eventString = JSON.stringify(event).toLowerCase()
          return eventString.includes(searchText)
        })
      }

      // Sort by timestamp (newest first)
      filteredEvents.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      // Apply limit
      const limit = query.limit || 100
      const limitedEvents = filteredEvents.slice(0, limit)

      // Get unique stream names
      const streams = [...new Set(filteredEvents.map(event => event.streamId))]

      return {
        events: limitedEvents,
        total: filteredEvents.length,
        streams,
      }
    } catch (error) {
      logger.error('Failed to search events:', error)
      throw error
    }
  }

  /**
   * Get stream statistics and health information
   */
  async getStreamStatistics(): Promise<{
    totalStreams: number
    totalEvents: number
    totalSize: number
    streamTypes: Record<string, number>
    eventTypes: Record<string, number>
    recentActivity: {
      last24Hours: number
      last7Days: number
      last30Days: number
    }
  }> {
    try {
      logger.info('Getting stream statistics')

      // Read from $all stream
      const allEvents = await this.kurrentDBService.readAll({
        maxCount: 10000,
        direction: FORWARDS,
      })

      // Group events by stream
      const streamMap = new Map<string, StreamEvent[]>()

      for (const event of allEvents) {
        const streamName = event.streamId
        if (!streamMap.has(streamName)) {
          streamMap.set(streamName, [])
        }
        streamMap.get(streamName)!.push(event)
      }

      const totalStreams = streamMap.size
      const totalEvents = allEvents.length

      // Calculate total size
      const totalSize = allEvents.reduce((acc, event) => {
        return acc + JSON.stringify(event).length
      }, 0)

      // Count stream types
      const streamTypes: Record<string, number> = {}
      for (const streamName of streamMap.keys()) {
        const type = this.getStreamType(streamName)
        streamTypes[type] = (streamTypes[type] || 0) + 1
      }

      // Count event types
      const eventTypes: Record<string, number> = {}
      for (const event of allEvents) {
        eventTypes[event.type] = (eventTypes[event.type] || 0) + 1
      }

      // Calculate recent activity
      const now = new Date()
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const recentActivity = {
        last24Hours: allEvents.filter(event => new Date(event.timestamp) >= last24Hours).length,
        last7Days: allEvents.filter(event => new Date(event.timestamp) >= last7Days).length,
        last30Days: allEvents.filter(event => new Date(event.timestamp) >= last30Days).length,
      }

      return {
        totalStreams,
        totalEvents,
        totalSize,
        streamTypes,
        eventTypes,
        recentActivity,
      }
    } catch (error) {
      logger.error('Failed to get stream statistics:', error)
      throw error
    }
  }

  /**
   * Create a new stream with initial event
   */
  async createStreamWithEvent(
    streamName: string,
    eventType: string,
    eventData: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<{ streamName: string; eventId: string; revision: bigint }> {
    try {
      logger.info(`Creating stream ${streamName} with initial event`)

      const result = await this.kurrentDBService.appendToStream(
        streamName,
        {
          type: eventType,
          data: eventData,
          metadata: metadata || {},
        },
        {
          streamState: NO_STREAM, // Ensure stream doesn't exist
        }
      )

      return {
        streamName,
        eventId: result.eventId,
        revision: BigInt(result.revision),
      }
    } catch (error) {
      logger.error(`Failed to create stream ${streamName}:`, error)
      throw error
    }
  }

  /**
   * Helper method to determine stream type from name
   */
  private getStreamType(streamName: string): string {
    if (streamName.startsWith('service-uptime-')) {
      return 'uptime'
    } else if (streamName.startsWith('user-')) {
      return 'user'
    } else if (streamName.startsWith('system-')) {
      return 'system'
    } else {
      return 'other'
    }
  }

  /**
   * Get the underlying KurrentDB service
   */
  getKurrentDBService(): KurrentDBService {
    return this.kurrentDBService
  }
}
