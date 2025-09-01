# KurrentDB Streams API Documentation

This document describes all the streams that will be opened and managed by the Penguin Pool backend service using KurrentDB.

## Overview

The backend service uses KurrentDB as an event store to track service uptime, health metrics, and system events. All streams follow a consistent naming convention and event structure.

## Stream Naming Convention

- **Uptime Streams**: `service-uptime-{serviceName}`
- **User Data Streams**: `user-{userId}-{type}-{category}`
- **System Streams**: `system-{purpose}`

## Stream Specifications

### 1. Service Uptime Streams

#### Stream Name Pattern

```
service-uptime-{serviceName}
```

#### Supported Services

- `service-uptime-http` - HTTP service uptime tracking
- `service-uptime-websocket` - WebSocket service uptime tracking
- `service-uptime-database` - Database service uptime tracking

#### Stream Metadata

```typescript
{
  name: string
  description: string
  data: Record<string, unknown>
  metadata: {
    createdAt: Date
    updatedAt: Date
    version: number
    tags: ['uptime', 'monitoring', serviceName]
    owner: 'system'
  }
  status: 'active'
  permissions: {
    read: ['system']
    write: ['system']
    admin: ['system']
  }
}
```

#### Event Types

##### StreamCreated Event

```typescript
{
  type: "StreamCreated"
  data: {
    streamName: string
    description: string
    tags: string[]
    owner: string
    createdAt: string
    data: Record<string, unknown>
  }
}
```

##### ServiceStatusChanged Event

```typescript
{
  type: "ServiceStatusChanged"
  data: {
    serviceName: string
    status: 'up' | 'down' | 'degraded'
    timestamp: string
    duration?: number
    metadata?: {
      responseTime?: number
      error?: string
      performanceGrade?: string
    }
    eventId: string
  }
}
```

#### Example Events

**Service Status Change:**

```json
{
  "type": "ServiceStatusChanged",
  "data": {
    "serviceName": "http",
    "status": "up",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "duration": 5000,
    "metadata": {
      "responseTime": 45,
      "performanceGrade": "excellent"
    },
    "eventId": "evt_1234567890_abcdef"
  }
}
```

### 2. User Data Streams

#### Stream Name Pattern

```
user-{userId}-{type}-{category}
```

#### Stream Types

- `user-{userId}-profile` - User profile data
- `user-{userId}-preferences` - User preferences
- `user-{userId}-activity` - User activity logs
- `user-{userId}-loans` - User loan data
- `user-{userId}-offers` - User offer data

#### Stream Metadata

```typescript
{
  name: string
  description: string
  data: Record<string, unknown>
  metadata: {
    createdAt: Date
    updatedAt: Date
    version: number
    tags: ['user', type, category, isPublic ? 'public' : 'private']
    owner: userId
  }
  status: 'active'
  permissions: {
    read: isPublic ? ['*'] : [userId]
    write: [userId]
    admin: [userId]
  }
}
```

#### Event Types

##### UserDataUpdated Event

```typescript
{
  type: 'UserDataUpdated'
  data: {
    userId: string
    type: string
    category: string
    data: Record<string, unknown>
    isPublic: boolean
    timestamp: string
    eventId: string
  }
}
```

### 3. System Streams

#### Stream Name Pattern

```
system-{purpose}
```

#### System Stream Types

- `system-health-check` - Temporary health check stream (created during health checks)
- `connection-test` - Connection test stream (used for connection validation)

## API Endpoints

### Stream Management

#### Create Uptime Streams

```http
POST /api/uptime/create-streams
```

**Response:**

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "Stream creation completed",
  "results": [
    {
      "service": "http",
      "streamName": "service-uptime-http",
      "success": true,
      "streamId": "service-uptime-http"
    },
    {
      "service": "websocket",
      "streamName": "service-uptime-websocket",
      "success": true,
      "streamId": "service-uptime-websocket"
    },
    {
      "service": "database",
      "streamName": "service-uptime-database",
      "success": true,
      "streamId": "service-uptime-database"
    }
  ]
}
```

#### Test KurrentDB Connection

```http
GET /api/uptime/test-kurrentdb
```

**Response:**

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "KurrentDB connection test completed",
  "results": {
    "connection": "success",
    "health": "healthy",
    "responseTime": 45
  }
}
```

## Event Schema Definitions

### Base Event Structure

```typescript
interface BaseEvent {
  type: string
  data: Record<string, unknown>
  metadata?: Record<string, unknown>
  timestamp: string
  eventId: string
}
```

### Service Uptime Event Schema

```typescript
interface ServiceUptimeEvent extends BaseEvent {
  type: 'ServiceStatusChanged'
  data: {
    serviceName: 'http' | 'websocket' | 'database'
    status: 'up' | 'down' | 'degraded'
    timestamp: string
    duration?: number
    metadata?: {
      responseTime?: number
      error?: string
      performanceGrade?: 'excellent' | 'good' | 'acceptable' | 'slow'
    }
    eventId: string
  }
}
```

### User Data Event Schema

```typescript
interface UserDataEvent extends BaseEvent {
  type: 'UserDataUpdated'
  data: {
    userId: string
    type: string
    category: string
    data: Record<string, unknown>
    isPublic: boolean
    timestamp: string
    eventId: string
  }
}
```

## Stream Operations

### Reading Events

```typescript
// Read all events from a stream
const events = await kurrentDBService.readStream('service-uptime-http', {
  limit: 100,
  direction: 'forwards',
})

// Read events from a specific position
const events = await kurrentDBService.readStream('service-uptime-http', {
  from: 10,
  limit: 50,
  direction: 'forwards',
})
```

### Appending Events

```typescript
// Append a service status change event
await kurrentDBService.appendToStream('service-uptime-http', {
  type: 'ServiceStatusChanged',
  data: {
    serviceName: 'http',
    status: 'up',
    timestamp: new Date().toISOString(),
    responseTime: 45,
    performanceGrade: 'excellent',
  },
  metadata: {
    source: 'health-check',
  },
})
```

### Creating Streams

```typescript
// Create a new uptime stream
const stream = await kurrentDBService.createStream({
  name: 'service-uptime-newservice',
  description: 'Uptime tracking for new service',
  data: {},
  tags: ['uptime', 'monitoring', 'newservice'],
  owner: 'system',
})
```

## Performance Considerations

### Event Size Limits

- Maximum event data size: 1MB
- Recommended event data size: < 100KB
- Maximum events per stream: Unlimited (KurrentDB handles this)

### Read Performance

- Use pagination for large result sets
- Consider using `from` parameter for incremental reads
- Use appropriate `limit` values (default: 100)

### Write Performance

- Events are appended atomically
- Use batch operations when possible
- Consider event compression for large payloads

## Error Handling

### Common Error Scenarios

1. **Stream Not Found**: When reading from non-existent streams
2. **Connection Errors**: When KurrentDB server is unavailable
3. **Authentication Errors**: When credentials are invalid
4. **Permission Errors**: When user lacks stream access

### Error Response Format

```json
{
  "error": "StreamNotFoundError",
  "message": "Stream 'service-uptime-http' does not exist",
  "streamName": "service-uptime-http",
  "type": "stream-not-found"
}
```

## Monitoring and Observability

### Stream Metrics

- Total number of streams
- Active streams count
- Total events per stream
- Stream size in bytes
- Last event timestamp

### Health Monitoring

- Connection status
- Response times
- Error rates
- Stream availability

## Security Considerations

### Access Control

- System streams: Read/Write access for system user only
- User streams: Read/Write access for specific user
- Public streams: Read access for all users

### Data Privacy

- User data streams are private by default
- Sensitive data should be encrypted before storage
- Audit logs for all stream operations

## Migration and Versioning

### Stream Versioning

- Streams use semantic versioning in metadata
- Backward compatibility maintained for event schemas
- Migration scripts for schema changes

### Data Migration

- Export/import functionality for stream data
- Backup and restore procedures
- Cross-environment data synchronization

---

_This documentation is automatically generated and should be updated when stream schemas or operations change._
