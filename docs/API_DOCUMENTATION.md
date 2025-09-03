# 🐧 Penguin Pool API Documentation

## Overview

The Penguin Pool backend provides a comprehensive REST API built with NestJS and TypeScript, featuring automatic OpenAPI 3.0 documentation generation. The API integrates with KurrentDB for event sourcing and stream management, providing robust data persistence and real-time capabilities.

## 🚀 Quick Access

- **Interactive API Documentation**: [http://localhost:3002/api/docs](http://localhost:3002/api/docs)
- **OpenAPI JSON Specification**: [http://localhost:3002/api/docs-json](http://localhost:3002/api/docs-json)
- **API Base URL**: `http://localhost:3002`

## 📋 API Modules

### 1. Health Monitoring (`/health`)

Monitor system health and service status.

#### Endpoints:

- `GET /health` - Basic health check
- `GET /health/kurrentdb` - KurrentDB-specific health check
- `GET /health/comprehensive` - Comprehensive system health status

#### Example Response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "kurrentdb-proxy",
  "kurrentdb_url": "http://localhost:2113",
  "version": "1.0.0"
}
```

### 2. Stream Management (`/api/streams`)

Complete CRUD operations for event streams with KurrentDB integration.

#### Endpoints:

- `GET /api/streams/browse` - Browse all streams with pagination
- `GET /api/streams/:streamName/details` - Get stream details
- `POST /api/streams/search` - Search events across streams
- `GET /api/streams/statistics` - Get stream statistics
- `POST /api/streams/create` - Create new stream
- `GET /api/streams/:streamName/events` - Read stream events
- `POST /api/streams/:streamName/events` - Append events to stream
- `GET /api/streams/all/events` - Read from $all stream
- `GET /api/streams/health` - Stream health status

#### Example Stream Creation:

```json
{
  "streamName": "user-events",
  "eventType": "UserCreated",
  "eventData": {
    "userId": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "metadata": {
    "source": "web-app",
    "version": "1.0"
  }
}
```

### 3. Uptime Monitoring (`/api/uptime`)

Service uptime tracking and performance monitoring.

#### Endpoints:

- `GET /api/uptime/summary` - Uptime summary for all services
- `GET /api/uptime/service/:serviceName` - Service-specific uptime
- `GET /api/uptime/timeline/:serviceName` - Service uptime timeline
- `GET /api/uptime/status` - Current service statuses
- `GET /api/uptime/stats` - Uptime statistics
- `POST /api/uptime/check` - Manual status check
- `POST /api/uptime/create-streams` - Create uptime tracking streams
- `GET /api/uptime/test-kurrentdb` - Test KurrentDB connection

#### Example Uptime Summary:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "period": "24 hours",
  "services": [
    {
      "service": "http",
      "uptime": 99.9,
      "status": "up",
      "lastCheck": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 4. KurrentDB Integration (`/kurrentdb`)

Proxy endpoints for direct KurrentDB operations.

#### Endpoints:

- `GET /kurrentdb/*` - Proxy GET requests to KurrentDB
- `POST /kurrentdb/*` - Proxy POST requests to KurrentDB

### 5. Status (`/api`)

API status and information endpoints.

#### Endpoints:

- `GET /api/status` - API status information

## 🔧 API Features

### Automatic Documentation Generation

The API uses NestJS decorators to automatically generate comprehensive OpenAPI 3.0 documentation:

```typescript
@ApiTags('streams')
@Controller('api/streams')
export class StreamsController {
  @Get(':streamName/events')
  @ApiOperation({ summary: 'Read events from a specific stream' })
  @ApiParam({ name: 'streamName', description: 'Stream name', example: 'user-events' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Stream not found' })
  async readStreamEvents(@Param('streamName') streamName: string) {
    // Implementation
  }
}
```

### Request/Response Validation

All endpoints use class-validator for automatic request validation:

```typescript
export class StreamAppendEventDto {
  @ApiProperty({ description: 'Event type' })
  @IsString()
  @IsNotEmpty()
  eventType: string

  @ApiProperty({ description: 'Event data', type: 'object' })
  @IsObject()
  eventData: Record<string, unknown>
}
```

### Error Handling

Consistent error responses across all endpoints:

```json
{
  "success": false,
  "error": "Stream not found",
  "message": "No stream found with name: invalid-stream",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🚀 Getting Started

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

The API will be available at `http://localhost:3002`

### 2. Access Documentation

Open your browser and navigate to:

- **Interactive Documentation**: `http://localhost:3002/api/docs`
- **Raw OpenAPI Spec**: `http://localhost:3002/api/docs-json`

### 3. Test Endpoints

Use the interactive Swagger UI to:

- Explore all available endpoints
- Test API calls directly from the browser
- View request/response schemas
- Download the OpenAPI specification

## 🔌 Integration Examples

### Frontend Integration

```typescript
// Fetch stream events
const response = await fetch('http://localhost:3002/api/streams/user-events/events?limit=10')
const data = await response.json()

// Create a new stream
const newStream = await fetch('http://localhost:3002/api/streams/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    streamName: 'user-events',
    eventType: 'UserCreated',
    eventData: { userId: '123', name: 'John Doe' },
  }),
})
```

### Postman Integration

1. Import the OpenAPI spec from `http://localhost:3002/api/docs-json`
2. All endpoints will be automatically imported with proper schemas
3. Test collections can be created and shared

### Code Generation

Generate client SDKs using the OpenAPI specification:

```bash
# Generate TypeScript client
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3002/api/docs-json \
  -g typescript-axios \
  -o src/generated/api
```

## 📊 API Statistics

- **Total Endpoints**: 21
- **API Modules**: 5 (Health, Streams, Uptime, KurrentDB, Status)
- **OpenAPI Version**: 3.0.0
- **Documentation Coverage**: 100%
- **Interactive Testing**: Available
- **Request Validation**: Automatic
- **Response Schemas**: Fully documented

## 🔒 Security

- **CORS**: Configured for development origins
- **Rate Limiting**: 100 requests per minute per IP
- **Input Validation**: All requests validated with class-validator
- **Error Handling**: Secure error responses without sensitive data exposure

## 🛠️ Development

### Adding New Endpoints

1. Create controller with proper decorators:

```typescript
@ApiTags('your-module')
@Controller('api/your-module')
export class YourController {
  @Get()
  @ApiOperation({ summary: 'Your endpoint' })
  @ApiResponse({ status: 200, description: 'Success' })
  async yourMethod() {
    // Implementation
  }
}
```

2. Add to module and import in `app.module.ts`

3. Documentation will automatically update when you restart the server

### Customizing Documentation

Modify the Swagger configuration in `src/main.ts`:

```typescript
const config = new DocumentBuilder()
  .setTitle('KurrentDB Backend API')
  .setDescription('Backend service for KurrentDB integration with Penguin Pool')
  .setVersion('1.0')
  .addTag('health', 'Health check endpoints')
  .addTag('streams', 'Stream management endpoints')
  .build()
```

## 📝 Changelog

### Version 1.0.0

- ✅ Complete API documentation with Swagger/OpenAPI 3.0
- ✅ Health monitoring endpoints
- ✅ Stream management with KurrentDB integration
- ✅ Uptime tracking and monitoring
- ✅ KurrentDB proxy endpoints
- ✅ Status and information endpoints
- ✅ Interactive Swagger UI
- ✅ Automatic request/response validation
- ✅ Comprehensive error handling

## 🤝 Contributing

When adding new endpoints:

1. Use proper NestJS decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`)
2. Add request/response DTOs with validation
3. Include comprehensive error handling
4. Test endpoints in the Swagger UI
5. Update this documentation if needed

The API documentation is automatically generated from your code, so focus on writing clean, well-decorated controllers and DTOs!
