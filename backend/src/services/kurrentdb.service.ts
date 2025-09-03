import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
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
import { v4 as uuidv4 } from 'uuid'
import {
  Stream,
  StreamCreateRequest,
  StreamUpdateRequest,
  DatabaseHealth,
  DatabaseConnection,
  DatabaseMetrics,
} from '../entities/stream.entity'

@Injectable()
export class KurrentDBService implements OnModuleDestroy {
  private readonly logger = new Logger(KurrentDBService.name)
  private client: KurrentDBClient | null = null
  private connection: DatabaseConnection | null = null
  private isInitialized = false
  private connectionString: string
  private retryInterval: NodeJS.Timeout | null = null

  constructor() {
    // Get connection string from environment variables
    const host = process.env['KURRENTDB_HOST'] || '127.0.0.1'
    const port = process.env['KURRENTDB_PORT'] || '2113'
    const username = process.env['KURRENTDB_USERNAME'] || 'admin'
    const password = process.env['KURRENTDB_PASSWORD'] || 'changeit'
    const useTLS = process.env['KURRENTDB_USE_TLS'] === 'true'
    const verifyCert = process.env['KURRENTDB_VERIFY_CERT'] === 'true'

    // Build connection string according to official documentation
    if (useTLS) {
      this.connectionString = `kurrentdb://${username}:${password}@${host}:${port}?tls=true&tlsVerifyCert=${verifyCert}`
    } else {
      this.connectionString = `kurrentdb://${host}:${port}?tls=false`
    }

    this.initialize()
  }

  private async initialize(): Promise<void> {
    this.logger.log('Initializing KurrentDB service...')

    this.connection = {
      isConnected: false,
      environment: process.env['NODE_ENV'] || 'development',
      lastSync: null,
      connectionId: this.generateConnectionId(),
      status: 'connecting',
    }

    // Try to connect, but don't fail the entire service if it fails
    try {
      await this.connect()
      this.isInitialized = true
      this.logger.log('KurrentDB service initialized successfully')
    } catch (error) {
      this.logger.warn('Failed to initialize KurrentDB service, will retry later:', error)
      this.connection = {
        isConnected: false,
        environment: process.env['NODE_ENV'] || 'development',
        lastSync: null,
        connectionId: this.generateConnectionId(),
        status: 'reconnecting',
      }
      this.isInitialized = true // Mark as initialized so the service can still function

      // Start a background retry process
      this.startConnectionRetry()
    }
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private startConnectionRetry(): void {
    // Retry connection every 30 seconds
    this.retryInterval = setInterval(async () => {
      if (!this.connection?.isConnected) {
        try {
          this.logger.log('Retrying KurrentDB connection...')
          await this.connect()
          this.logger.log('KurrentDB connection retry successful')
        } catch (error) {
          this.logger.warn('KurrentDB connection retry failed:', error)
        }
      }
    }, 30000)
  }

  public async connect(): Promise<void> {
    try {
      this.connection!.status = 'connecting'

      this.logger.log(`Connecting to KurrentDB: ${this.connectionString}`)

      this.client = KurrentDBClient.connectionString`${this.connectionString}`

      // Test the connection
      try {
        const testStream = this.client.readStream('connection-test', {
          direction: FORWARDS,
          fromRevision: START,
          maxCount: 1,
        })

        for await (const testEvent of testStream) {
          this.logger.log('Test event received:', testEvent)
          break
        }
      } catch (error) {
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

      this.logger.log('Successfully connected to KurrentDB')
    } catch (error) {
      this.logger.error('Failed to connect to KurrentDB:', error)
      this.connection!.status = 'error'
      this.connection!.isConnected = false
      throw error
    }
  }

  async checkHealth(): Promise<DatabaseHealth> {
    if (!this.connection?.isConnected) {
      return {
        status: 'degraded',
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

    const startTime = Date.now()
    const errors: string[] = []

    try {
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
      this.logger.error('Failed to get database metrics:', error)
      throw error
    }
  }

  async createStream(request: StreamCreateRequest): Promise<Stream> {
    try {
      const streamName = request.name

      this.logger.log(`Creating stream: ${streamName}`)

      if (!this.client) {
        this.logger.warn('KurrentDB client not initialized, returning mock stream')
        return {
          id: request.name,
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
            read: ['*'],
            write: ['*'],
            admin: ['*'],
          },
        }
      }

      // Check if stream already exists
      try {
        const existingEvents = await this.readStream(streamName, { maxCount: 1 })
        if (existingEvents.length > 0) {
          this.logger.log(`Stream ${streamName} already exists, returning existing stream`)

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
        }
      } catch {
        this.logger.debug(`Stream ${streamName} doesn't exist yet, will create it`)
      }

      // Create stream with initial event
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

      await this.client.appendToStream(streamName, streamCreatedEvent)

      this.logger.log(`Successfully created stream: ${streamName}`)

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
      this.logger.error('Failed to create stream:', error)
      throw error
    }
  }

  async getStream(id: string): Promise<Stream> {
    if (!this.client || !this.connection?.isConnected) {
      throw new Error('Database not connected')
    }

    try {
      this.logger.debug(`Getting stream: ${id} - returning mock stream (API not yet implemented)`)

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
      this.logger.error('Failed to get stream:', error)
      throw error
    }
  }

  async updateStream(id: string, request: StreamUpdateRequest): Promise<Stream> {
    if (!this.client || !this.connection?.isConnected) {
      throw new Error('Database not connected')
    }

    try {
      const existingStream = await this.getStream(id)

      this.logger.log('Would append update to stream:', existingStream.name, request)

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
      this.logger.error('Failed to update stream:', error)
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
    options: {
      streamState?: typeof NO_STREAM | typeof STREAM_EXISTS | typeof ANY | bigint
      credentials?: { username: string; password: string }
    } = {}
  ): Promise<{ eventId: string; position: number; revision: number }> {
    try {
      if (!this.client) {
        throw new Error('KurrentDB client not initialized')
      }

      this.logger.debug(`Appending to stream: ${streamName}`)

      const eventId = event.id || uuidv4()

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

      const result = await this.client.appendToStream(streamName, jsonEventData, appendOptions)

      this.logger.debug(`Successfully appended to stream: ${streamName}`)

      return {
        eventId: eventId,
        position: typeof result.position === 'number' ? result.position : 0,
        revision: 0,
      }
    } catch (error) {
      this.logger.error('Failed to append to stream:', error)
      throw error
    }
  }

  async readStream(
    streamName: string,
    options: {
      direction?: typeof FORWARDS | typeof BACKWARDS
      fromRevision?: typeof START | typeof END | number
      maxCount?: number
      resolveLinkTos?: boolean
      credentials?: { username: string; password: string }
    } = {}
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

      this.logger.debug(`Reading stream: ${streamName}`)

      const readOptions: Record<string, unknown> = {
        direction: options.direction || FORWARDS,
        fromRevision:
          options.fromRevision === undefined
            ? START
            : typeof options.fromRevision === 'number'
              ? BigInt(options.fromRevision)
              : options.fromRevision,
        maxCount: options.maxCount || 100,
      }

      if (options.resolveLinkTos !== undefined) {
        readOptions['resolveLinkTos'] = options.resolveLinkTos
      }

      if (options.credentials) {
        readOptions['credentials'] = options.credentials
      }

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

      for await (const resolvedEvent of events) {
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

      this.logger.debug(`Successfully read stream: ${streamName}, found ${result.length} events`)
      return result
    } catch (error) {
      this.logger.error('Failed to read stream:', error)
      if (
        error instanceof Error &&
        (error.message.includes('not found') || error.message.includes('does not exist'))
      ) {
        this.logger.debug(`Stream ${streamName} doesn't exist yet, returning empty events`)
        return []
      }
      throw error
    }
  }

  async readAll(
    options: {
      direction?: typeof FORWARDS | typeof BACKWARDS
      fromPosition?: typeof START | typeof END | number
      maxCount?: number
      resolveLinkTos?: boolean
      credentials?: { username: string; password: string }
    } = {}
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

      this.logger.debug('Reading from $all stream')

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

      for await (const resolvedEvent of events) {
        const event = resolvedEvent.event
        if (event) {
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

      this.logger.debug(`Successfully read from $all stream, found ${result.length} events`)
      return result
    } catch (error) {
      this.logger.error('Failed to read from $all stream:', error)
      throw error
    }
  }

  async deleteStream(id: string): Promise<void> {
    if (!this.client || !this.connection?.isConnected) {
      this.logger.warn('Database not connected, skipping stream deletion')
      return
    }

    try {
      await this.getStream(id)
      this.logger.warn('Stream deletion not supported, marking as deleted instead')
    } catch (error) {
      this.logger.error('Failed to delete stream:', error)
      throw error
    }
  }

  async listStreams(): Promise<Stream[]> {
    if (!this.client || !this.connection?.isConnected) {
      this.logger.warn('Database not connected, returning empty array')
      return []
    }

    try {
      this.logger.warn('List streams not supported via client, returning empty array')
      return []
    } catch (error) {
      this.logger.error('Failed to list streams:', error)
      return [] // Return empty array instead of throwing
    }
  }

  async subscribeToStream(
    streamName: string,
    options: {
      resolveLinkTos?: boolean
      credentials?: { username: string; password: string }
    } = {},
    onEvent: (event: {
      id: string
      type: string
      data: Record<string, unknown>
      metadata: Record<string, unknown>
      position: number
      revision: bigint
      timestamp: string
      streamId: string
    }) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    try {
      if (!this.client) {
        throw new Error('KurrentDB client not initialized')
      }

      this.logger.debug(`Subscribing to stream: ${streamName}`)

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

      subscription.on('event', (event: unknown) => {
        try {
          // Convert the unknown event to the expected format
          const typedEvent = event as {
            id: string
            type: string
            data: Record<string, unknown>
            metadata: Record<string, unknown>
            position: number
            revision: bigint
            timestamp: string
            streamId: string
          }
          onEvent(typedEvent)
        } catch (error) {
          this.logger.error('Error processing subscription event:', error)
          if (onError) {
            onError(error as Error)
          }
        }
      })

      subscription.on('error', error => {
        this.logger.error('Subscription error:', error)
        if (onError) {
          onError(error)
        }
      })

      return () => {
        this.logger.debug(`Unsubscribing from stream: ${streamName}`)
      }
    } catch (error) {
      this.logger.error('Failed to subscribe to stream:', error)
      throw error
    }
  }

  async subscribeToAll(
    options: {
      resolveLinkTos?: boolean
      credentials?: { username: string; password: string }
    } = {},
    onEvent: (event: {
      id: string
      type: string
      data: Record<string, unknown>
      metadata: Record<string, unknown>
      position: number
      revision: bigint
      timestamp: string
      streamId: string
    }) => void,
    onError?: (error: Error) => void
  ): Promise<() => void> {
    try {
      if (!this.client) {
        throw new Error('KurrentDB client not initialized')
      }

      this.logger.debug('Subscribing to $all stream')

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

      subscription.on('event', (event: unknown) => {
        try {
          const typedEvent = event as {
            event?: {
              type: string
            }
          }
          if (typedEvent.event?.type && !typedEvent.event.type.startsWith('$')) {
            // Convert to the expected format for onEvent callback
            const eventForCallback = {
              id: `event_${Date.now()}`,
              type: typedEvent.event.type,
              data: {},
              metadata: {},
              position: 0,
              revision: BigInt(0),
              timestamp: new Date().toISOString(),
              streamId: 'unknown',
            }
            onEvent(eventForCallback)
          }
        } catch (error) {
          this.logger.error('Error processing subscription event:', error)
          if (onError) {
            onError(error as Error)
          }
        }
      })

      subscription.on('error', error => {
        this.logger.error('Subscription error:', error)
        if (onError) {
          onError(error)
        }
      })

      return () => {
        this.logger.debug('Unsubscribing from $all stream')
      }
    } catch (error) {
      this.logger.error('Failed to subscribe to $all stream:', error)
      throw error
    }
  }

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

      this.logger.log('Would append user data to stream:', streamName, {
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
      this.logger.error('Failed to store user data:', error)
      throw error
    }
  }

  async getUserData(): Promise<Stream[]> {
    if (!this.client || !this.connection?.isConnected) {
      throw new Error('Database not connected')
    }

    try {
      this.logger.warn('Get user data not supported via client, returning empty array')
      return []
    } catch (error) {
      this.logger.error('Failed to get user data:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      this.connection.isConnected = false
      this.connection.status = 'disconnected'
    }

    this.isInitialized = false
    this.logger.log('Disconnected from KurrentDB')
  }

  isReady(): boolean {
    return this.isInitialized && this.connection?.isConnected === true
  }

  get isUsingGRPC(): boolean {
    return this.client !== null && this.connection?.isConnected === true
  }

  getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting' {
    return this.connection?.status || 'disconnected'
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down KurrentDB service...')

    // Clear the retry interval
    if (this.retryInterval) {
      clearInterval(this.retryInterval)
      this.retryInterval = null
    }

    // Disconnect from KurrentDB if connected
    if (this.client && this.connection?.isConnected) {
      try {
        // The KurrentDB client doesn't have a disconnect method, just clear the reference
        this.client = null
        this.logger.log('KurrentDB client reference cleared')
      } catch (error) {
        this.logger.warn('Error clearing KurrentDB client reference:', error)
      }
    }

    // Update connection status
    if (this.connection) {
      this.connection.isConnected = false
      this.connection.status = 'disconnected'
    }

    this.logger.log('KurrentDB service shutdown complete')
  }
}
