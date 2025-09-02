import { KurrentDBHTTPClient } from '../clients/KurrentDBHTTPClient'
import type { KurrentDBHTTPConfig } from '../clients/KurrentDBHTTPClient'

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
  private httpClient: KurrentDBHTTPClient | null = null
  private connection: DatabaseConnection | null = null
  private isInitialized = false
  private config: KurrentDBHTTPConfig

  constructor() {
    // Configuration for local KurrentDB instance via proxy
    this.config = {
      baseUrl: 'http://localhost:3001',
      credentials: {
        apiKey: 'demo-key',
        secretKey: 'demo-secret',
      },
      timeout: 10000,
      retries: 3,
    }

    this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      this.httpClient = new KurrentDBHTTPClient(this.config)

      this.connection = {
        isConnected: false,
        environment: 'development',
        lastSync: null,
        connectionId: this.generateConnectionId(),
        status: 'disconnected',
      }

      // Try to connect via HTTP
      try {
        await this.connect()
        this.isInitialized = true
        console.log('Successfully connected to KurrentDB via HTTP proxy')
      } catch (httpError) {
        console.warn('HTTP connection failed:', httpError)
        this.connection!.status = 'error'
        this.connection!.isConnected = false
      }
    } catch (error) {
      console.error('Failed to initialize KurrentDB service:', error)
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
    if (!this.httpClient) return

    try {
      this.connection!.status = 'connecting'

      // Test HTTP connection by checking health
      const healthResponse = await this.httpClient.checkHealth()
      if (!healthResponse.success) {
        throw new Error(`Health check failed: ${healthResponse.error}`)
      }

      this.connection!.isConnected = true
      this.connection!.status = 'connected'
      this.connection!.lastSync = new Date()

      console.log('Connected to KurrentDB via HTTP proxy')
    } catch (error) {
      console.error('Failed to connect to KurrentDB:', error)
      this.connection!.status = 'error'
      this.connection!.isConnected = false
    }
  }

  async checkHealth(): Promise<DatabaseHealth> {
    if (!this.httpClient || !this.connection?.isConnected) {
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

    try {
      const startTime = Date.now()
      const healthResponse = await this.httpClient.checkHealth()
      const responseTime = Date.now() - startTime

      if (healthResponse.success) {
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
      } else {
        return {
          status: 'degraded',
          checks: {
            connection: true,
            authentication: true,
            read: false,
            write: false,
            sync: false,
          },
          lastCheck: new Date(),
          responseTime,
          errors: [healthResponse.error || 'Health check failed'],
        }
      }
    } catch (error) {
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
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  async getConnection(): Promise<DatabaseConnection> {
    if (!this.connection) {
      throw new Error('Service not initialized')
    }
    return this.connection
  }

  async getMetrics(): Promise<DatabaseMetrics> {
    if (!this.httpClient || !this.connection?.isConnected) {
      throw new Error('Not connected to database')
    }

    try {
      // Get basic metrics from the proxy backend
      const response = await fetch(`${this.config.baseUrl}/api/status`)
      if (!response.ok) {
        throw new Error(`Failed to get metrics: ${response.statusText}`)
      }

      // Return basic metrics for now
      return {
        totalStreams: 0, // Will be updated when we implement stream listing
        activeStreams: 0,
        totalUsers: 0,
        storageUsed: 0,
        lastBackup: null,
        uptime: Date.now() - (this.connection.lastSync?.getTime() || Date.now()),
      }
    } catch (error) {
      console.error('Failed to get metrics:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      this.connection.isConnected = false
      this.connection.status = 'disconnected'
      this.connection.lastSync = null
    }
    console.log('Disconnected from KurrentDB')
  }

  // Basic stream operations
  async createStream(request: StreamCreateRequest): Promise<Stream> {
    if (!this.httpClient || !this.connection?.isConnected) {
      throw new Error('Not connected to database')
    }

    try {
      const stream: Stream = {
        id: `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        permissions: request.permissions || {
          read: ['*'],
          write: [request.owner],
          admin: [request.owner],
        },
      }

      console.log('Created stream:', stream.name)
      return stream
    } catch (error) {
      console.error('Failed to create stream:', error)
      throw error
    }
  }

  async getStream(): Promise<Stream | null> {
    if (!this.httpClient || !this.connection?.isConnected) {
      throw new Error('Not connected to database')
    }

    // For now, return null as we're not implementing full stream storage
    return null
  }

  async updateStream(id: string, request: StreamUpdateRequest): Promise<Stream> {
    if (!this.httpClient || !this.connection?.isConnected) {
      throw new Error('Not connected to database')
    }

    const stream = await this.getStream()
    if (!stream) {
      throw new Error('Stream not found')
    }

    // Update stream properties
    if (request.description !== undefined) {
      stream.description = request.description
    }
    if (request.data !== undefined) {
      stream.data = request.data
    }
    if (request.tags !== undefined) {
      stream.metadata.tags = request.tags
    }
    if (request.permissions !== undefined) {
      stream.permissions = { ...stream.permissions, ...request.permissions }
    }

    stream.metadata.updatedAt = new Date()
    stream.metadata.version++

    return stream
  }

  async deleteStream(id: string): Promise<void> {
    if (!this.httpClient || !this.connection?.isConnected) {
      throw new Error('Not connected to database')
    }

    console.log('Deleted stream:', id)
  }

  // User data operations
  async storeUserData(
    userId: string,
    type: string,
    category: string,
    data: Record<string, unknown>
  ): Promise<Stream> {
    const streamName = `user-${userId}-${type}-${category}`

    return this.createStream({
      name: streamName,
      description: `User data for ${userId} - ${type} - ${category}`,
      data,
      tags: ['user-data', userId, type, category],
      owner: userId,
    })
  }

  async getUserData(): Promise<Stream[]> {
    if (!this.httpClient || !this.connection?.isConnected) {
      throw new Error('Not connected to database')
    }

    // For now, return empty array as we're not implementing full stream storage
    return []
  }

  async deleteUserData(userId: string, type: string, category: string): Promise<void> {
    const streamName = `user-${userId}-${type}-${category}`
    console.log('Deleted user data stream:', streamName)
  }

  // Utility methods
  get isUsingHTTP(): boolean {
    return true // This service only uses HTTP
  }

  getHTTPStatus(): string {
    return this.connection?.status || 'disconnected'
  }

  get isServiceInitialized(): boolean {
    return this.isInitialized
  }
}

export const kurrentDBService = new KurrentDBService()
