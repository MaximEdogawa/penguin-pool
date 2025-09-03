import { ApiProperty } from '@nestjs/swagger'

export class StreamMetadata {
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date

  @ApiProperty({ description: 'Stream version number' })
  version: number

  @ApiProperty({ description: 'Stream tags', type: [String] })
  tags: string[]

  @ApiProperty({ description: 'Stream owner' })
  owner: string
}

export class StreamPermissions {
  @ApiProperty({ description: 'Users with read access', type: [String] })
  read: string[]

  @ApiProperty({ description: 'Users with write access', type: [String] })
  write: string[]

  @ApiProperty({ description: 'Users with admin access', type: [String] })
  admin: string[]
}

export class Stream {
  @ApiProperty({ description: 'Stream unique identifier' })
  id: string

  @ApiProperty({ description: 'Stream name' })
  name: string

  @ApiProperty({ description: 'Stream description', required: false })
  description?: string

  @ApiProperty({ description: 'Stream data', type: 'object' })
  data: Record<string, unknown>

  @ApiProperty({ description: 'Stream metadata', type: StreamMetadata })
  metadata: StreamMetadata

  @ApiProperty({ description: 'Stream status', enum: ['active', 'archived', 'deleted'] })
  status: 'active' | 'archived' | 'deleted'

  @ApiProperty({ description: 'Stream permissions', type: StreamPermissions })
  permissions: StreamPermissions
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

export interface DatabaseConnection {
  isConnected: boolean
  environment: string
  lastSync: Date | null
  connectionId: string
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'
}

export interface DatabaseMetrics {
  totalStreams: number
  activeStreams: number
  totalUsers: number
  storageUsed: number
  lastBackup: Date | null
  uptime: number
}
