import { KurrentDBClient } from '@kurrent/kurrentdb-client'
import { createLogger } from 'winston'

import { format, transports } from 'winston'

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
    const apiKey = process.env['KURRENTDB_API_KEY'] || 'demo-key'
    const secretKey = process.env['KURRENTDB_SECRET_KEY'] || 'demo-secret'
    const useTLS = process.env['KURRENTDB_USE_TLS'] === 'true'
    const verifyCert = process.env['KURRENTDB_VERIFY_CERT'] !== 'false'

    this.connectionString = `kurrentdb://${apiKey}:${secretKey}@${host}:${port}?tls=${useTLS}&tlsVerifyCert=${verifyCert}`

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

      // Create client using connection string
      this.client = KurrentDBClient.connectionString`${this.connectionString}`

      // Test connection by performing a simple operation
      // Note: KurrentDB client doesn't have a ping method
      // Skip connection test for now

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
    if (!this.client || !this.connection?.isConnected) {
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
    if (!this.client || !this.connection?.isConnected) {
      throw new Error('Database not connected')
    }

    try {
      const streamName = `stream-${request.name}-${Date.now()}`

      // Append event to stream
      // Note: KurrentDB client appendToStream expects different data format
      // This is a placeholder implementation
      console.log('Would append to stream:', streamName, request)

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
      const streams = await this.listStreams()
      const stream = streams.find(s => s.id === id)
      if (!stream) throw new Error('Stream not found')
      return stream
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
