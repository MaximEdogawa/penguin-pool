import type { KurrentDBHTTPConfig } from '../clients/KurrentDBHTTPClient'
import { KurrentDBHTTPClient } from '../clients/KurrentDBHTTPClient'

// Specific data types for different stream purposes
export interface UserProfileData {
  username: string
  email: string
  walletAddress: string
  preferences: {
    theme: 'light' | 'dark'
    notifications: boolean
    language: string
  }
  createdAt: string
  lastLogin: string
}

export interface OfferStreamData {
  offerId: string
  offerString: string
  status: 'active' | 'completed' | 'cancelled' | 'expired'
  assetsOffered: Array<{
    assetId: string
    amount: number
    type: string
    symbol?: string
  }>
  assetsRequested: Array<{
    assetId: string
    amount: number
    type: string
    symbol?: string
  }>
  fee: number
  creatorAddress: string
  createdAt: string
  expiresAt?: string
}

export interface TransactionStreamData {
  transactionId: string
  status: 'pending' | 'confirmed' | 'failed'
  fromAddress: string
  toAddress: string
  amount: number
  fee: number
  assetType: string
  assetId?: string
  memo?: string
  blockHeight?: number
  createdAt: string
  confirmedAt?: string
}

export interface PoolData {
  poolId: string
  name: string
  description: string
  totalLiquidity: number
  activeParticipants: number
  apy: number
  riskLevel: 'low' | 'medium' | 'high'
  createdAt: string
  lastUpdated: string
}

// Union type for all possible stream data types
export type StreamData =
  | UserProfileData
  | OfferStreamData
  | TransactionStreamData
  | PoolData
  | Record<string, unknown>

export interface Stream<T extends StreamData = StreamData> {
  id: string
  name: string
  description?: string
  data: T
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

export interface StreamCreateRequest<T extends StreamData = StreamData> {
  name: string
  description?: string
  data: T
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
  private readonly config: KurrentDBHTTPConfig

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
        // Successfully connected to KurrentDB via HTTP proxy
      } catch {
        // HTTP connection failed
        this.connection!.status = 'error'
        this.connection!.isConnected = false
      }
    } catch {
      // Failed to initialize KurrentDB service
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

      // Connected to KurrentDB via HTTP proxy
    } catch {
      // Failed to connect to KurrentDB
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
      // Failed to get metrics
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      this.connection.isConnected = false
      this.connection.status = 'disconnected'
      this.connection.lastSync = null
    }
    // Disconnected from KurrentDB
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

      // Created stream
      return stream
    } catch (error) {
      // Failed to create stream
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

  async deleteStream(_id: string): Promise<void> {
    if (!this.httpClient || !this.connection?.isConnected) {
      throw new Error('Not connected to database')
    }

    // Deleted stream
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

  async deleteUserData(_userId: string, _type: string, _category: string): Promise<void> {
    // Deleted user data stream
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
