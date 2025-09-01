# KurrentDB Stream Inventory

This document provides a complete inventory of all streams that will be opened and managed by the Penguin Pool backend service.

## Stream Categories

### 1. Service Uptime Streams

**Purpose**: Track the uptime and health status of backend services

| Stream Name                | Service   | Description                                           | Owner  | Tags                                    |
| -------------------------- | --------- | ----------------------------------------------------- | ------ | --------------------------------------- |
| `service-uptime-http`      | HTTP API  | Tracks HTTP service uptime and response times         | system | `['uptime', 'monitoring', 'http']`      |
| `service-uptime-websocket` | WebSocket | Tracks WebSocket service uptime and connection status | system | `['uptime', 'monitoring', 'websocket']` |
| `service-uptime-database`  | Database  | Tracks KurrentDB connection and performance           | system | `['uptime', 'monitoring', 'database']`  |

### 2. User Data Streams

**Purpose**: Store user-specific data and activity

| Stream Name Pattern         | Type        | Description                      | Owner  | Tags                                 |
| --------------------------- | ----------- | -------------------------------- | ------ | ------------------------------------ |
| `user-{userId}-profile`     | Profile     | User profile information         | userId | `['user', 'profile', 'private']`     |
| `user-{userId}-preferences` | Preferences | User settings and preferences    | userId | `['user', 'preferences', 'private']` |
| `user-{userId}-activity`    | Activity    | User activity logs and events    | userId | `['user', 'activity', 'private']`    |
| `user-{userId}-loans`       | Loans       | User loan data and history       | userId | `['user', 'loans', 'private']`       |
| `user-{userId}-offers`      | Offers      | User offer data and transactions | userId | `['user', 'offers', 'private']`      |

### 3. System Streams

**Purpose**: System-level operations and health checks

| Stream Name           | Purpose         | Description                                  | Owner  | Tags                            |
| --------------------- | --------------- | -------------------------------------------- | ------ | ------------------------------- |
| `system-health-check` | Health Check    | Temporary stream for health check operations | system | `['system', 'health-check']`    |
| `connection-test`     | Connection Test | Used for validating KurrentDB connection     | system | `['system', 'connection-test']` |

## Stream Event Types

### Service Uptime Events

#### StreamCreated

```json
{
  "type": "StreamCreated",
  "data": {
    "streamName": "service-uptime-http",
    "description": "Service uptime tracking for http",
    "tags": ["uptime", "monitoring", "http"],
    "owner": "system",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "data": {}
  }
}
```

#### ServiceStatusChanged

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

### User Data Events

#### UserDataUpdated

```json
{
  "type": "UserDataUpdated",
  "data": {
    "userId": "user123",
    "type": "profile",
    "category": "personal",
    "data": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "isPublic": false,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "eventId": "evt_1234567890_abcdef"
  }
}
```

## Stream Operations

### Read Operations

```typescript
// Read all events from uptime stream
const events = await kurrentDBService.readStream('service-uptime-http', {
  limit: 100,
  direction: 'forwards',
})

// Read user profile events
const profileEvents = await kurrentDBService.readStream('user-user123-profile', {
  limit: 50,
  direction: 'forwards',
})
```

### Write Operations

```typescript
// Append service status change
await kurrentDBService.appendToStream('service-uptime-http', {
  type: 'ServiceStatusChanged',
  data: {
    serviceName: 'http',
    status: 'up',
    timestamp: new Date().toISOString(),
    responseTime: 45,
    performanceGrade: 'excellent',
  },
})

// Append user data update
await kurrentDBService.appendToStream('user-user123-profile', {
  type: 'UserDataUpdated',
  data: {
    userId: 'user123',
    type: 'profile',
    category: 'personal',
    data: { name: 'John Doe' },
    isPublic: false,
  },
})
```

## Stream Lifecycle

### Creation

1. **Uptime Streams**: Created automatically during service initialization
2. **User Streams**: Created on first user data write
3. **System Streams**: Created temporarily for specific operations

### Maintenance

- **Retention**: Events are retained indefinitely (KurrentDB handles this)
- **Archiving**: Streams can be archived but not deleted
- **Monitoring**: All streams are monitored for health and performance

### Cleanup

- **Temporary Streams**: System streams are cleaned up after operations
- **User Streams**: Retained for user data integrity
- **Uptime Streams**: Retained for historical analysis

## Performance Metrics

### Expected Event Volumes

- **Uptime Streams**: ~1 event per minute per service
- **User Streams**: Variable based on user activity
- **System Streams**: Minimal, temporary usage

### Storage Estimates

- **Uptime Events**: ~1KB per event
- **User Events**: ~5-50KB per event (depending on data type)
- **System Events**: ~1KB per event

## Security and Access Control

### Access Levels

- **System Streams**: System user only
- **User Streams**: Owner user only (unless public)
- **Uptime Streams**: System user only

### Data Privacy

- **User Data**: Encrypted at rest
- **Sensitive Fields**: Additional encryption layer
- **Audit Trail**: All operations logged

## Monitoring and Alerting

### Stream Health

- **Connection Status**: Monitored continuously
- **Event Volume**: Tracked for anomalies
- **Response Times**: Monitored for performance

### Alerts

- **Stream Unavailable**: Immediate alert
- **High Error Rate**: Alert after threshold
- **Storage Limits**: Proactive monitoring

## Backup and Recovery

### Backup Strategy

- **Daily Backups**: Full stream data backup
- **Incremental Backups**: Hourly incremental changes
- **Cross-Region**: Backup replication for disaster recovery

### Recovery Procedures

- **Point-in-Time Recovery**: Restore to specific timestamp
- **Stream Recovery**: Individual stream restoration
- **Full System Recovery**: Complete system restoration

## Migration and Versioning

### Schema Evolution

- **Backward Compatibility**: Maintained for all event types
- **Version Tracking**: Stream metadata includes version
- **Migration Scripts**: Automated schema migrations

### Data Migration

- **Export/Import**: Full stream data export/import
- **Selective Migration**: Individual stream migration
- **Validation**: Post-migration data validation

---

_This inventory is maintained automatically and updated when new streams are added or existing streams are modified._
