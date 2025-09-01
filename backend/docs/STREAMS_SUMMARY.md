# KurrentDB Streams Summary

## Complete Stream List

### Service Uptime Streams (3 streams)

| Stream Name                | Purpose                      | Events/Hour | Owner  |
| -------------------------- | ---------------------------- | ----------- | ------ |
| `service-uptime-http`      | HTTP service monitoring      | ~60         | system |
| `service-uptime-websocket` | WebSocket service monitoring | ~60         | system |
| `service-uptime-database`  | Database service monitoring  | ~60         | system |

### User Data Streams (5 stream types)

| Stream Pattern              | Purpose            | Events/Hour | Owner  |
| --------------------------- | ------------------ | ----------- | ------ |
| `user-{userId}-profile`     | User profile data  | Variable    | userId |
| `user-{userId}-preferences` | User preferences   | Variable    | userId |
| `user-{userId}-activity`    | User activity logs | Variable    | userId |
| `user-{userId}-loans`       | User loan data     | Variable    | userId |
| `user-{userId}-offers`      | User offer data    | Variable    | userId |

### System Streams (2 stream types)

| Stream Name           | Purpose                 | Events/Hour | Owner  |
| --------------------- | ----------------------- | ----------- | ------ |
| `system-health-check` | Health check operations | ~10         | system |
| `connection-test`     | Connection validation   | ~5          | system |

## Total Stream Count

- **Fixed Streams**: 5 (3 uptime + 2 system)
- **Dynamic Streams**: 5 × number of users
- **Total Estimated**: 5 + (5 × active users)

## Event Types Summary

### 1. StreamCreated

- **Purpose**: Initial stream creation
- **Frequency**: Once per stream
- **Size**: ~1KB

### 2. ServiceStatusChanged

- **Purpose**: Service uptime tracking
- **Frequency**: ~60/hour per service
- **Size**: ~1KB

### 3. UserDataUpdated

- **Purpose**: User data changes
- **Frequency**: Variable
- **Size**: ~5-50KB

## API Endpoints

### Stream Management

- `POST /api/uptime/create-streams` - Create uptime streams
- `GET /api/uptime/test-kurrentdb` - Test connection

### Stream Operations (via KurrentDBService)

- `createStream()` - Create new stream
- `readStream()` - Read events from stream
- `appendToStream()` - Append events to stream
- `getStream()` - Get stream metadata
- `updateStream()` - Update stream metadata
- `deleteStream()` - Archive stream

## Documentation Files

- `STREAMS_API.md` - Complete API documentation
- `streams-openapi.json` - OpenAPI 3.0 specification
- `STREAM_INVENTORY.md` - Detailed stream inventory
- `STREAM_ARCHITECTURE.md` - Visual architecture diagrams
- `STREAMS_SUMMARY.md` - This summary document

---

_Generated automatically from backend source code analysis_
