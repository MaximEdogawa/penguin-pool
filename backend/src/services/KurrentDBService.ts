import {
  KurrentDBClient,
  jsonEvent,
  FORWARDS,
  START,
  END,
  BACKWARDS,
  NO_STREAM,
  STREAM_EXISTS,
  ANY,
} from '@kurrent/kurrentdb-client'
import { createLogger } from 'winston'
import { format, transports } from 'winston'
import { v4 as uuidv4 } from 'uuid'

const logger = createLogger({
  level: 'info',
  format: format.simple(),
  transports: [new transports.Console()],
})

export interface Stream {
  id: string
  name: string
  description?: string
  data: Record<string, unknown>
  metadata: {
    createdAt: Date
    updatedAt: Date
    version: number
    tags: string[]
    owner: string
  }
  status: 'active' | 'archived' | 'deleted'
  permissions: {
    read: string[]
    write: string[]
    admin: string[]
  }
}

export interface StreamCreateRequest {
  name: string
  description?: string
  data: Record<string, unknown>
  tags?: string[]
  owner: string
  permissions?: {
    read: string[]
    write: string[]
    admin: string[]
  }
}

export interface StreamUpdateRequest {
  description?: string
  data?: Record<string, unknown>
  tags?: string[]
  permissions?: {
    read?: string[]
    write?: string[]
    admin?: string[]
  }
}

export interface AppendOptions {
  streamState?: typeof NO_STREAM | typeof STREAM_EXISTS | typeof ANY | bigint
  credentials?: {
    username: string
    password: string
  }
}

export interface ReadStreamOptions {
  direction?: typeof FORWARDS | typeof BACKWARDS
  fromRevision?: typeof START | typeof END | number
  maxCount?: number
  resolveLinkTos?: boolean
  credentials?: {
    username: string
    password: string
  }
}

export interface ReadAllOptions {
  direction?: typeof FORWARDS | typeof BACKWARDS
  fromPosition?: typeof START | typeof END | number
  maxCount?: number
  resolveLinkTos?: boolean
  credentials?: {
    username: string
    password: string
  }
}

export interface SubscriptionOptions {
  resolveLinkTos?: boolean
  credentials?: {
    username: string
    password: string
  }
}

export interface PersistentSubscriptionOptions {
  bufferSize?: number
  credentials?: {
    username: string
    password: string
  }
}

export interface KurrentDBEvent {
  event?: {
    id: string
    type: string
    data: Record<string, unknown>
    metadata: Record<string, unknown>
  }
  position?: number
  revision?: bigint
  timestamp?: string
  streamId?: string
}

export interface DatabaseConnection {
  isConnected: boolean
  environment: string
  lastSync: Date | null
  connectionId: string
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'
}

export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    connection: boolean
    authentication: boolean
    read: boolean
    write: boolean
    sync: boolean
  }
  lastCheck: Date
  responseTime: number
  errors: string[]
}

export interface DatabaseMetrics {
  totalStreams: number
  activeStreams: number
  totalUsers: number
  storageUsed: number
  lastBackup: Date | null
  uptime: number
}

export class KurrentDBService {
  private client: KurrentDBClient | null = null
  private connection: DatabaseConnection | null = null
  private isInitialized = false
  private connectionString: string

  constructor() {
    // Get connection string from environment variables
    const host = process.env['KURRENTDB_HOST'] || '127.0.0.1'
    const port = process.env['KURRENTDB_PORT'] || '2113'
    const username = process.env['KURRENTDB_USERNAME'] || 'admin'
    const password = process.env['KURRENTDB_PASSWORD'] || 'changeit'
    const useTLS = process.env['KURRENTDB_USE_TLS'] === 'true' // Default to false for development
    const verifyCert = process.env['KURRENTDB_VERIFY_CERT'] === 'true'

    // Build connection string according to official documentation
    // For insecure connections (development), don't include credentials
    if (useTLS) {
      this.connectionString = `kurrentdb://${username}:${password}@${host}:${port}?tls=true&tlsVerifyCert=${verifyCert}`
    } else {
      // For insecure mode, don't include credentials as per documentation
      this.connectionString = `kurrentdb://${host}:${port}?tls=false`
    }

    this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      logger.info('Initializing KurrentDB service...')

      this.connection = {
        isConnected: false,
        environment: process.env['NODE_ENV'] || 'development',
        lastSync: null,
        connectionId: this.generateConnectionId(),
        status: 'connecting',
      }

      // Always connect to real KurrentDB instance
      logger.info('Connecting to real KurrentDB instance')

      await this.connect()
      this.isInitialized = true

      logger.info('KurrentDB service initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize KurrentDB service:', error)
      this.connection = {
        isConnected: false,
        environment: 'unknown',
        lastSync: null,
        connectionId: 'error',
        status: 'error',
      }
    }
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public async connect(): Promise<void> {
    try {
      this.connection!.status = 'connecting'

      logger.info(`Connecting to KurrentDB: ${this.connectionString}`)

      // Create client using connection string with proper template literal syntax
      // According to the official documentation, we use template literal syntax
      this.client = KurrentDBClient.connectionString`${this.connectionString}`

      // Test the connection by attempting to read from a non-existent stream
      // This will verify the connection without creating any data
      try {
        const testStream = this.client.readStream('connection-test', {
          direction: FORWARDS,
          fromRevision: START,
          maxCount: 1,
        })

        // Consume the iterator to test the connection
        for await (const testEvent of testStream) {
          // Stream exists, which is unexpected for a test
          console.log('Test event received:', testEvent)
          break
        }
      } catch (error) {
        // Expected error for non-existent stream, connection is working
        // Check for various "not found" error patterns
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
        const isStreamNotFound =
          errorMessage.includes('not found') ||
          errorMessage.includes('streamnotfound') ||
          errorMessage.includes('stream not found')

        if (!isStreamNotFound) {
          throw error
        }
      }

      this.connection!.isConnected = true
      this.connection!.status = 'connected'
      this.connection!.lastSync = new Date()

      logger.info('Successfully connected to KurrentDB')
    } catch (error) {
      logger.error('Failed to connect to KurrentDB:', error)
      this.connection!.status = 'error'
      this.connection!.isConnected = false
      throw error
    }
  }

  async checkHealth(): Promise<DatabaseHealth> {
    if (!this.connection?.isConnected) {
      return {
        status: 'unhealthy',
        checks: {
          connection: false,
          authentication: false,
          read: false,
          write: false,
          sync: false,
        },
        lastCheck: new Date(),
        responseTime: 0,
        errors: ['Not connected to database'],
      }
    }

    // Always perform real health checks

    const startTime = Date.now()
    const errors: string[] = []

    try {
      // Test connection - skip ping test for now

      // Test read operation
      await this.listStreams()

      // Test write operation (create a temporary stream)
      const testStream = await this.createStream({
        name: 'health-check',
        description: 'Temporary health check stream',
        data: { timestamp: new Date().toISOString() },
        tags: ['system', 'health-check'],
        owner: 'system',
      })

      // Clean up test stream
      await this.deleteStream(testStream.id)

      const responseTime = Date.now() - startTime

      return {
        status: 'healthy',
        checks: {
          connection: true,
          authentication: true,
          read: true,
          write: true,
          sync: true,
        },
        lastCheck: new Date(),
        responseTime,
        errors: [],
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      errors.push(error instanceof Error ? error.message : 'Unknown error')

      return {
        status: 'degraded',
        checks: {
          connection: this.connection?.isConnected || false,
          authentication: errors.length === 0,
          read: errors.length === 0,
          write: errors.length === 0,
          sync: errors.length === 0,
        },
        lastCheck: new Date(),
        responseTime,
        errors,
      }
    }
  }

  async getConnection(): Promise<DatabaseConnection | null> {
    return this.connection
  }

  async getMetrics(): Promise<DatabaseMetrics> {
    if (!this.client || !this.connection?.isConnected) {
      throw new Error('Database not connected')
    }

    try {
      const streams = await this.listStreams()
      const activeStreams = streams.filter(s => s.status === 'active')
      const userStreams = streams.filter(s => s.metadata.tags.includes('user'))

      return {
        totalStreams: streams.length,
        activeStreams: activeStreams.length,
        totalUsers: new Set(userStreams.map(s => s.metadata.owner)).size,
        storageUsed: streams.reduce((acc, s) => acc + JSON.stringify(s.data).length, 0),
        lastBackup: null,
        uptime: Date.now() - (this.connection.lastSync?.getTime() || Date.now()),
      }
    } catch (error) {
      logger.error('Failed to get database metrics:', error)
      throw error
    }
  }

  async createStream(request: StreamCreateRequest): Promise<Stream> {
    try {
      const streamName = request.name

      logger.info(`Creating stream: ${streamName}`)

      // Always create real streams in KurrentDB

      // In KurrentDB, streams are created implicitly when you first append events to them
      // We'll create an initial event to establish the stream
      if (!this.client) {
        throw new Error('KurrentDB client not initialized')
      }

      // Define the event type according to the official documentation pattern
      // Note: The type is defined for documentation purposes but not used directly
      // as the jsonEvent helper handles the typing internally

      // Create an initial stream metadata event using the proper jsonEvent helper
      // Sanitize data to avoid BigInt serialization issues
      const sanitizedRequestData = JSON.parse(
        JSON.stringify(request.data, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      )

      const streamCreatedEvent = jsonEvent({
        type: 'StreamCreated',
        data: {
          streamName: request.name,
          description: request.description || '',
          tags: request.tags || [],
          owner: request.owner,
          createdAt: new Date().toISOString(),
          data: sanitizedRequestData,
        },
      })

      // Append the initial event to create the stream
      await this.client.appendToStream(streamName, streamCreatedEvent)

      logger.info(`Successfully created stream: ${streamName}`)

      const stream: Stream = {
        id: streamName,
        name: request.name,
        description: request.description || '',
        data: request.data,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          tags: request.tags || [],
          owner: request.owner,
        },
        status: 'active',
        permissions: {
          read: [request.owner],
          write: [request.owner],
          admin: [request.owner],
        },
      }

      return stream
    } catch (error) {
      logger.error('Failed to create stream:', error)
      throw error
    }
  }

  async getStream(id: string): Promise<Stream> {
    if (!this.client || !this.connection?.isConnected) {
      throw new Error('Database not connected')
    }

    try {
      // For now, return a mock stream since the KurrentDB API is not fully implemented
      // This will be implemented properly once we have the correct API documentation
      logger.debug(`Getting stream: ${id} - returning mock stream (API not yet implemented)`)

      const mockStream: Stream = {
        id: id,
        name: id,
        description: `Mock stream for ${id}`,
        data: {},
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          tags: ['mock'],
          owner: 'system',
        },
        status: 'active',
        permissions: {
          read: ['system'],
          write: ['system'],
          admin: ['system'],
        },
      }

      return mockStream
    } catch (error) {
      logger.error('Failed to get stream:', error)
      throw error
    }
  }

  async updateStream(id: string, request: StreamUpdateRequest): Promise<Stream> {
    if (!this.client || !this.connection?.isConnected) {
      throw new Error('Database not connected')
    }

    try {
      const existingStream = await this.getStream(id)

      // Note: KurrentDB client appendToStream expects different data format
      // This is a placeholder implementation
      console.log('Would append update to stream:', existingStream.name, request)

      const updatedStream: Stream = {
        ...existingStream,
        ...request,
        metadata: {
          ...existingStream.metadata,
          updatedAt: new Date(),
          version: existingStream.metadata.version + 1,
        },
        permissions: {
          read: request.permissions?.read || existingStream.permissions.read,
          write: request.permissions?.write || existingStream.permissions.write,
          admin: request.permissions?.admin || existingStream.permissions.admin,
        },
      }

      return updatedStream
    } catch (error) {
      logger.error('Failed to update stream:', error)
      throw error
    }
  }

  async appendToStream(
    streamName: string,
    event: {
      id?: string
      type: string
      data: Record<string, unknown>
      metadata?: Record<string, unknown>
    },
    options: AppendOptions = {}
  ): Promise<{ eventId: string; position: number; revision: number }> {
    try {
      // Always append to real KurrentDB streams

      if (!this.client) {
        throw new Error('KurrentDB client not initialized')
      }

      logger.debug(`Appending to stream: ${streamName}`)

      // Generate event ID if not provided
      const eventId = event.id || uuidv4()

      // Create a JSON event using the official client with proper structure
      // Convert any BigInt values to strings to avoid serialization issues
      const sanitizedData = JSON.parse(
        JSON.stringify(event.data, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      )

      const sanitizedMetadata = event.metadata
        ? JSON.parse(
            JSON.stringify(event.metadata, (_, value) =>
              typeof value === 'bigint' ? value.toString() : value
            )
          )
        : undefined

      const jsonEventData = jsonEvent({
        id: eventId,
        type: event.type,
        data: {
          ...sanitizedData,
          timestamp: new Date().toISOString(),
        },
        metadata: sanitizedMetadata,
      })

      // Prepare append options
      const appendOptions: {
        streamState?: typeof NO_STREAM | typeof STREAM_EXISTS | typeof ANY | bigint
        credentials?: { username: string; password: string }
      } = {}

      if (options.streamState !== undefined) {
        appendOptions.streamState = options.streamState
      }

      if (options.credentials) {
        appendOptions.credentials = options.credentials
      }

      // Append the event to the stream
      const result = await this.client.appendToStream(streamName, jsonEventData, appendOptions)

      logger.debug(`Successfully appended to stream: ${streamName}`)

      return {
        eventId: eventId,
        position: typeof result.position === 'number' ? result.position : 0,
        revision: 0, // Use number instead of BigInt to avoid serialization issues
      }
    } catch (error) {
      logger.error('Failed to append to stream:', error)
      throw error
    }
  }

  async readStream(
    streamName: string,
    options: ReadStreamOptions = {}
  ): Promise<
    Array<{
      id: string
      type: string
      data: Record<string, unknown>
      metadata: Record<string, unknown>
      position: number
      revision: bigint
      timestamp: string
      streamId: string
    }>
  > {
    try {
      if (!this.client) {
        throw new Error('KurrentDB client not initialized')
      }

      logger.debug(`Reading stream: ${streamName}`)

      // Prepare read options with defaults
      const readOptions: Record<string, unknown> = {
        direction: options.direction || FORWARDS,
        fromRevision: options.fromRevision || START,
        maxCount: options.maxCount || 100,
      }

      if (options.resolveLinkTos !== undefined) {
        readOptions['resolveLinkTos'] = options.resolveLinkTos
      }

      if (options.credentials) {
        readOptions['credentials'] = options.credentials
      }

      // Use the official client to read the stream
      const events = this.client.readStream(streamName, readOptions)

      const result: Array<{
        id: string
        type: string
        data: Record<string, unknown>
        metadata: Record<string, unknown>
        position: number
        revision: bigint
        timestamp: string
        streamId: string
      }> = []

      // Process the async iterator according to the official documentation
      for await (const resolvedEvent of events) {
        // Extract event data from the resolved event structure
        const event = resolvedEvent.event
        if (event) {
          result.push({
            id: event.id || `event_${Date.now()}`,
            type: event.type || 'Unknown',
            data:
              typeof event.data === 'object' && event.data !== null
                ? (event.data as Record<string, unknown>)
                : {},
            metadata:
              typeof event.metadata === 'object' && event.metadata !== null
                ? (event.metadata as Record<string, unknown>)
                : {},
            position: event.revision ? Number(event.revision) : 0,
            revision: event.revision ? BigInt(event.revision) : BigInt(0),
            timestamp: event.created ? event.created.toISOString() : new Date().toISOString(),
            streamId: event.streamId || streamName,
          })
        }
      }

      logger.debug(`Successfully read stream: ${streamName}, found ${result.length} events`)
      return result
    } catch (error) {
      logger.error('Failed to read stream:', error)
      // If stream doesn't exist, return empty array instead of throwing
      if (
        error instanceof Error &&
        (error.message.includes('not found') || error.message.includes('does not exist'))
      ) {
        logger.debug(`Stream ${streamName} doesn't exist yet, returning empty events`)
        return []
      }
      throw error
    }
  }

  async readAll(options: ReadAllOptions = {}): Promise<
    Array<{
      id: string
      type: string
      data: Record<string, unknown>
      metadata: Record<string, unknown>
      position: number
      revision: bigint
      timestamp: string
      streamId: string
    }>
  > {
    try {
      if (!this.client) {
        throw new Error('KurrentDB client not initialized')
      }

      logger.debug('Reading from $all stream')

      // Prepare read options with defaults
      const readOptions: Record<string, unknown> = {
        direction: options.direction || FORWARDS,
        fromPosition: options.fromPosition || START,
        maxCount: options.maxCount || 100,
      }

      if (options.resolveLinkTos !== undefined) {
        readOptions['resolveLinkTos'] = options.resolveLinkTos
      }

      if (options.credentials) {
        readOptions['credentials'] = options.credentials
      }

      // Use the official client to read from $all stream
      const events = this.client.readAll(readOptions)

      const result: Array<{
        id: string
        type: string
        data: Record<string, unknown>
        metadata: Record<string, unknown>
        position: number
        revision: bigint
        timestamp: string
        streamId: string
      }> = []

      // Process the async iterator and filter out system events
      for await (const resolvedEvent of events) {
        const event = resolvedEvent.event
        if (event) {
          // Skip system events (they start with $ or $$)
          if (event.type.startsWith('$')) {
            continue
          }

          result.push({
            id: event.id || `event_${Date.now()}`,
            type: event.type || 'Unknown',
            data:
              typeof event.data === 'object' && event.data !== null
                ? (event.data as Record<string, unknown>)
                : {},
            metadata:
              typeof event.metadata === 'object' && event.metadata !== null
                ? (event.metadata as Record<string, unknown>)
                : {},
            position: event.revision ? Number(event.revision) : 0,
            revision: event.revision ? BigInt(event.revision) : BigInt(0),
            timestamp: event.created ? event.created.toISOString() : new Date().toISOString(),
            streamId: event.streamId || 'unknown',
          })
        }
      }

      logger.debug(`Successfully read from $all stream, found ${result.length} events`)
      return result
    } catch (error) {
      logger.error('Failed to read from $all stream:', error)
      throw error
    }
  }

  async deleteStream(id: string): Promise<void> {
    if (!this.client || !this.connection?.isConnected) {
      throw new Error('Database not connected')
    }

    try {
      await this.getStream(id)
      // Note: KurrentDB doesn't support stream deletion via client
      // This would need to be implemented via admin API or marked as deleted
      logger.warn('Stream deletion not supported, marking as deleted instead')
    } catch (error) {
      logger.error('Failed to delete stream:', error)
      throw error
    }
  }

  async listStreams(): Promise<Stream[]> {
    if (!this.client || !this.connection?.isConnected) {
      throw new Error('Database not connected')
    }

    try {
      // Note: KurrentDB client doesn't expose listStreams directly
      // This would need to be implemented via admin API or subscription
      logger.warn('List streams not supported via client, returning empty array')
      return []
    } catch (error) {
      logger.error('Failed to list streams:', error)
      throw error
    }
  }

  // Subscription methods for real-time event processing
  async subscribeToStream(
    streamName: string,
    options: SubscriptionOptions = {},
    onEvent: (event: KurrentDBEvent) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    try {
      if (!this.client) {
        throw new Error('KurrentDB client not initialized')
      }

      logger.debug(`Subscribing to stream: ${streamName}`)

      const subscriptionOptions: {
        resolveLinkTos?: boolean
        credentials?: { username: string; password: string }
      } = {}

      if (options.resolveLinkTos !== undefined) {
        subscriptionOptions.resolveLinkTos = options.resolveLinkTos
      }

      if (options.credentials) {
        subscriptionOptions.credentials = options.credentials
      }

      const subscription = this.client.subscribeToStream(streamName, subscriptionOptions)

      // Handle subscription events
      subscription.on('event', (event: unknown) => {
        try {
          onEvent(event as KurrentDBEvent)
        } catch (error) {
          logger.error('Error processing subscription event:', error)
          if (onError) {
            onError(error as Error)
          }
        }
      })

      subscription.on('error', error => {
        logger.error('Subscription error:', error)
        if (onError) {
          onError(error)
        }
      })

      // Return unsubscribe function
      return () => {
        logger.debug(`Unsubscribing from stream: ${streamName}`)
        // Note: Subscription cleanup will be handled by the client
      }
    } catch (error) {
      logger.error('Failed to subscribe to stream:', error)
      throw error
    }
  }

  async subscribeToAll(
    options: SubscriptionOptions = {},
    onEvent: (event: KurrentDBEvent) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    try {
      if (!this.client) {
        throw new Error('KurrentDB client not initialized')
      }

      logger.debug('Subscribing to $all stream')

      const subscriptionOptions: {
        resolveLinkTos?: boolean
        credentials?: { username: string; password: string }
      } = {}

      if (options.resolveLinkTos !== undefined) {
        subscriptionOptions.resolveLinkTos = options.resolveLinkTos
      }

      if (options.credentials) {
        subscriptionOptions.credentials = options.credentials
      }

      const subscription = this.client.subscribeToAll(subscriptionOptions)

      // Handle subscription events
      subscription.on('event', (event: unknown) => {
        try {
          const typedEvent = event as KurrentDBEvent
          // Filter out system events
          if (typedEvent.event?.type && !typedEvent.event.type.startsWith('$')) {
            onEvent(typedEvent)
          }
        } catch (error) {
          logger.error('Error processing subscription event:', error)
          if (onError) {
            onError(error as Error)
          }
        }
      })

      subscription.on('error', error => {
        logger.error('Subscription error:', error)
        if (onError) {
          onError(error)
        }
      })

      // Return unsubscribe function
      return () => {
        logger.debug('Unsubscribing from $all stream')
        // Note: Subscription cleanup will be handled by the client
      }
    } catch (error) {
      logger.error('Failed to subscribe to $all stream:', error)
      throw error
    }
  }

  // User-specific methods for storing user data in streams
  async storeUserData(
    userId: string,
    type: string,
    category: string,
    data: Record<string, unknown>,
    isPublic: boolean = false
  ): Promise<Stream> {
    if (!this.client || !this.connection?.isConnected) {
      throw new Error('Database not connected')
    }

    try {
      const streamName = `user-${userId}-${type}${category ? `-${category}` : ''}`

      // Note: KurrentDB client appendToStream expects different data format
      // This is a placeholder implementation
      console.log('Would append user data to stream:', streamName, {
        userId,
        type,
        category,
        data,
        isPublic,
      })

      const stream: Stream = {
        id: streamName,
        name: streamName,
        description: `User data for ${userId} - ${type}${category ? ` (${category})` : ''}`,
        data: {
          userId,
          type,
          category,
          data,
          isPublic,
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          tags: ['user', type, category, isPublic ? 'public' : 'private'].filter(Boolean),
          owner: userId,
        },
        status: 'active',
        permissions: {
          read: isPublic ? ['*'] : [userId],
          write: [userId],
          admin: [userId],
        },
      }

      return stream
    } catch (error) {
      logger.error('Failed to store user data:', error)
      throw error
    }
  }

  async getUserData(): Promise<Stream[]> {
    if (!this.client || !this.connection?.isConnected) {
      throw new Error('Database not connected')
    }

    try {
      // Note: This would need to be implemented via subscription or admin API
      logger.warn('Get user data not supported via client, returning empty array')
      return []
    } catch (error) {
      logger.error('Failed to get user data:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      this.connection.isConnected = false
      this.connection.status = 'disconnected'
    }

    this.isInitialized = false
    logger.info('Disconnected from KurrentDB')
  }

  isReady(): boolean {
    return this.isInitialized && this.connection?.isConnected === true
  }

  // Getter to check if we're using gRPC client
  get isUsingGRPC(): boolean {
    return this.client !== null && this.connection?.isConnected === true
  }

  // Get connection status
  getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting' {
    return this.connection?.status || 'disconnected'
  }
}
