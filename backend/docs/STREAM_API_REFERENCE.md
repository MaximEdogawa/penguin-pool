# Stream Management API Reference

Complete API reference for the Penguin Pool KurrentDB stream management system.

## Base URL

```
http://localhost:3001/api/streams
```

## Authentication

All endpoints support optional authentication via query parameters or headers:

- `username`: KurrentDB username
- `password`: KurrentDB password

## Response Format

All responses follow this format:

```json
{
  "success": true|false,
  "data": <response_data>,
  "error": "<error_type>",
  "message": "<error_message>",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Endpoints

### 1. Browse Streams

Browse all streams with pagination and filtering.

```http
GET /api/streams/browse
```

#### Query Parameters

| Parameter     | Type    | Default | Description                                        |
| ------------- | ------- | ------- | -------------------------------------------------- |
| `limit`       | integer | 50      | Maximum number of streams to return                |
| `offset`      | integer | 0       | Number of streams to skip                          |
| `namePattern` | string  | -       | Regex pattern to filter stream names               |
| `eventType`   | string  | -       | Filter by last event type                          |
| `dateFrom`    | string  | -       | Filter streams updated after this date (ISO 8601)  |
| `dateTo`      | string  | -       | Filter streams updated before this date (ISO 8601) |

#### Example Request

```http
GET /api/streams/browse?limit=20&offset=0&namePattern=service-uptime-.*&eventType=ServiceStatusChanged
```

### 2. Get Stream Details

Get detailed information about a specific stream.

```http
GET /api/streams/{streamName}/details
```

#### Path Parameters

| Parameter    | Type   | Description                           |
| ------------ | ------ | ------------------------------------- |
| `streamName` | string | Name of the stream to get details for |

#### Example Request

```http
GET /api/streams/service-uptime-http/details
```

### 3. Search Events

Search for events across all streams.

```http
POST /api/streams/search
```

#### Request Body

```json
{
  "text": "string (optional)",
  "eventType": "string (optional)",
  "streamName": "string (optional)",
  "dateFrom": "string (optional)",
  "dateTo": "string (optional)",
  "limit": "integer (optional, default: 100)"
}
```

#### Example Request

```http
POST /api/streams/search
Content-Type: application/json

{
  "text": "error",
  "eventType": "ServiceStatusChanged",
  "dateFrom": "2024-01-01T00:00:00.000Z",
  "dateTo": "2024-01-31T23:59:59.999Z",
  "limit": 50
}
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "evt_1234567890_error",
        "type": "ServiceStatusChanged",
        "data": {
          "serviceName": "http",
          "status": "down",
          "error": "Connection timeout"
        },
        "streamId": "service-uptime-http",
        "timestamp": "2024-01-15T09:30:00.000Z"
      }
    ],
    "total": 5,
    "streams": ["service-uptime-http", "service-uptime-database"]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. Get Statistics

Get comprehensive stream and event statistics.

```http
GET /api/streams/statistics
```

### 5. Create Stream

Create a new stream with an initial event.

```http
POST /api/streams/create
```

#### Request Body

```json
{
  "streamName": "string (required)",
  "eventType": "string (required)",
  "eventData": "object (required)",
  "metadata": "object (optional)"
}
```

#### Example Request

```http
POST /api/streams/create
Content-Type: application/json

{
  "streamName": "user-123-profile",
  "eventType": "UserProfileCreated",
  "eventData": {
    "userId": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "metadata": {
    "source": "api",
    "version": "1.0"
  }
}
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "streamName": "user-123-profile",
    "eventId": "evt_1234567890_new",
    "revision": "0"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 6. Read Stream Events

Read events from a specific stream.

```http
GET /api/streams/{streamName}/events
```

#### Path Parameters

| Parameter    | Type   | Description                     |
| ------------ | ------ | ------------------------------- |
| `streamName` | string | Name of the stream to read from |

#### Query Parameters

| Parameter      | Type    | Default    | Description                                  |
| -------------- | ------- | ---------- | -------------------------------------------- |
| `limit`        | integer | 100        | Maximum number of events to return           |
| `offset`       | integer | 0          | Number of events to skip                     |
| `direction`    | string  | "forwards" | Reading direction: "forwards" or "backwards" |
| `fromRevision` | integer | -          | Start reading from this revision             |

#### Example Request

```http
GET /api/streams/service-uptime-http/events?limit=50&offset=0&direction=forwards&fromRevision=100
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "evt_1234567890_100",
        "type": "ServiceStatusChanged",
        "data": {
          "serviceName": "http",
          "status": "up",
          "responseTime": 45
        },
        "metadata": {},
        "position": 100,
        "revision": "100",
        "timestamp": "2024-01-15T10:00:00.000Z",
        "streamId": "service-uptime-http"
      }
    ],
    "total": 150,
    "hasMore": true
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 7. Append Event

Append an event to a stream.

```http
POST /api/streams/{streamName}/events
```

#### Path Parameters

| Parameter    | Type   | Description                     |
| ------------ | ------ | ------------------------------- |
| `streamName` | string | Name of the stream to append to |

#### Request Body

```json
{
  "eventType": "string (required)",
  "eventData": "object (required)",
  "metadata": "object (optional)",
  "eventId": "string (optional)",
  "streamState": "string (optional)"
}
```

#### Stream State Options

- `"no_stream"`: Stream should not exist
- `"stream_exists"`: Stream should exist
- `"any"`: No concurrency check
- `number`: Stream should be at specific revision

#### Example Request

```http
POST /api/streams/service-uptime-http/events
Content-Type: application/json

{
  "eventType": "ServiceStatusChanged",
  "eventData": {
    "serviceName": "http",
    "status": "up",
    "responseTime": 42,
    "performanceGrade": "excellent"
  },
  "metadata": {
    "source": "health-check",
    "version": "1.0"
  },
  "streamState": "any"
}
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "eventId": "evt_1234567890_new",
    "position": 151,
    "revision": "151"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 8. Read from $all Stream

Read events from the global $all stream.

```http
GET /api/streams/all/events
```

#### Query Parameters

| Parameter      | Type    | Default    | Description                                  |
| -------------- | ------- | ---------- | -------------------------------------------- |
| `limit`        | integer | 100        | Maximum number of events to return           |
| `offset`       | integer | 0          | Number of events to skip                     |
| `direction`    | string  | "forwards" | Reading direction: "forwards" or "backwards" |
| `fromPosition` | integer | -          | Start reading from this position             |

#### Example Request

```http
GET /api/streams/all/events?limit=200&offset=0&direction=forwards&fromPosition=0
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "evt_1234567890_global",
        "type": "ServiceStatusChanged",
        "data": {
          "serviceName": "http",
          "status": "up"
        },
        "streamId": "service-uptime-http",
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 1250,
    "hasMore": true
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 9. Stream Health

Get stream health and connection status.

```http
GET /api/streams/health
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "health": {
      "status": "healthy",
      "checks": {
        "connection": true,
        "authentication": true,
        "read": true,
        "write": true,
        "sync": true
      },
      "lastCheck": "2024-01-15T10:30:00.000Z",
      "responseTime": 45,
      "errors": []
    },
    "connection": {
      "isConnected": true,
      "environment": "development",
      "lastSync": "2024-01-15T10:30:00.000Z",
      "connectionId": "conn_1234567890_abcdef",
      "status": "connected"
    },
    "isReady": true,
    "connectionStatus": "connected"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Responses

### Common Error Types

#### Stream Not Found

```json
{
  "success": false,
  "error": "StreamNotFoundError",
  "message": "Stream 'nonexistent-stream' does not exist",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Validation Error

```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Missing required fields: streamName, eventType, and eventData are required",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Connection Error

```json
{
  "success": false,
  "error": "ConnectionError",
  "message": "Failed to connect to KurrentDB: ECONNREFUSED",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Concurrency Error

```json
{
  "success": false,
  "error": "WrongExpectedVersionError",
  "message": "Expected stream revision 100, but stream is at revision 105",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Rate Limiting

All endpoints are rate limited to 100 requests per 15 minutes per IP address.

## CORS

The API supports CORS for the following origins:

- `http://localhost:5173`
- `http://localhost:3000`
- `http://127.0.0.1:3000`

## Content Types

- **Request**: `application/json`
- **Response**: `application/json`

## Status Codes

- `200`: Success
- `400`: Bad Request (validation errors)
- `404`: Not Found (stream not found)
- `500`: Internal Server Error

---

_This API reference provides complete documentation for all stream management endpoints._
