# TICKET-008: Kurrent DB Integration with NestJS

## Overview

This ticket implements Kurrent DB integration for the Penguin Pool application using NestJS framework, providing decentralized database functionality with support for multiple environments and comprehensive API documentation.

**User Story**: As a user - developer, I want to generate API spec from my predefined models and entities so that I minimize boilerplate code.

## Objectives

- Migrate from Express to NestJS framework
- Install and configure Kurrent DB
- Create database connection and streams
- Implement basic CRUD operations
- Store user streams
- Support multiple environments (dev, staging, test, mainnet)
- Set up Swagger UI with @nestjs/swagger decorators
- Define TypeScript interfaces for all entities
- Create database schemas with data validation

## Implementation Details

### 1. NestJS Framework Migration

- Migrated from Express to NestJS framework
- Implemented decorator-based architecture
- Added comprehensive dependency injection
- Set up modular structure with separate modules for each feature

### 2. Swagger UI Integration

- Integrated `@nestjs/swagger` for automatic API documentation
- Added comprehensive API decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`)
- Set up Swagger UI at `/api/docs` endpoint
- Generated OpenAPI 3.0 specification from decorators

### 3. TypeScript Entities and DTOs

- Created comprehensive entity classes with Swagger decorators:
  - `Stream`: Core stream data structure
  - `ServiceUptimeRecord`: Uptime tracking records
  - `DatabaseHealth`: Health check responses
- Implemented Data Transfer Objects (DTOs) with validation:
  - `StreamCreateRequestDto`: Stream creation validation
  - `StreamUpdateRequestDto`: Stream update validation
  - `UptimeQueryDto`: Query parameter validation
- Added class-validator decorators for request validation

### 4. Database Services

- `KurrentDBService`: Core database service with connection management
- `StreamManagementService`: Handles stream operations and CRUD functionality
- `UptimeTrackingService`: Manages service uptime monitoring
- **Real Implementation**: Full-featured client for Node.js environments

### 5. NestJS Modules Structure

- `HealthModule`: Health check endpoints and monitoring
- `StreamsModule`: Stream management and operations
- `UptimeModule`: Service uptime tracking and analytics
- `KurrentdbModule`: KurrentDB proxy functionality
- `WebSocketModule`: Real-time WebSocket connections
- `StatusModule`: API status endpoints

### 6. Environment Configuration

- Created environment-specific configurations for:
  - Development (dev)
  - Staging (staging)
  - Testing (test)
  - Mainnet (mainnet)
- Integrated with NestJS ConfigModule for global configuration

## File Structure

```
backend/src/
├── entities/
│   ├── stream.entity.ts
│   ├── uptime.entity.ts
│   └── health.entity.ts
├── dto/
│   ├── stream.dto.ts
│   ├── uptime.dto.ts
│   └── health.dto.ts
├── services/
│   └── kurrentdb.service.ts
├── health/
│   ├── health.module.ts
│   └── health.controller.ts
├── streams/
│   ├── streams.module.ts
│   ├── streams.controller.ts
│   └── stream-management.service.ts
├── uptime/
│   ├── uptime.module.ts
│   ├── uptime.controller.ts
│   └── uptime-tracking.service.ts
├── kurrentdb/
│   ├── kurrentdb.module.ts
│   └── kurrentdb.controller.ts
├── websocket/
│   ├── websocket.module.ts
│   └── websocket.gateway.ts
├── status/
│   ├── status.module.ts
│   └── status.controller.ts
├── app.module.ts
└── main.ts
```

## Environment Variables

```bash
# Server Configuration
HTTP_PORT=3001
WS_PORT=3002
NODE_ENV=development

# Kurrent DB Configuration
KURRENTDB_URL=http://localhost:2113
KURRENTDB_HOST=127.0.0.1
KURRENTDB_PORT=2113
KURRENTDB_USERNAME=admin
KURRENTDB_PASSWORD=changeit
KURRENTDB_USE_TLS=false
KURRENTDB_VERIFY_CERT=false

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:3000
```

## Usage Examples

### API Endpoints

#### Health Check

```bash
# Basic health check
GET /health

# KurrentDB health check
GET /health/kurrentdb

# Comprehensive health check
GET /health/comprehensive
```

#### Stream Management

```bash
# Browse streams
GET /api/streams/browse?limit=50&offset=0

# Get stream details
GET /api/streams/{streamName}/details

# Create stream with event
POST /api/streams/create
{
  "streamName": "user-profile",
  "eventType": "UserCreated",
  "eventData": { "userId": "123", "name": "John" }
}

# Read stream events
GET /api/streams/{streamName}/events?limit=100&direction=forwards

# Append event to stream
POST /api/streams/{streamName}/events
{
  "eventType": "UserUpdated",
  "eventData": { "name": "John Doe" }
}
```

#### Uptime Monitoring

```bash
# Get uptime summary
GET /api/uptime/summary?hours=24

# Get service uptime
GET /api/uptime/service/http?hours=24

# Get uptime timeline
GET /api/uptime/timeline/http?hours=24

# Manual status check
POST /api/uptime/check
```

### Swagger Documentation

Access the interactive API documentation at:

```
http://localhost:3001/api/docs
```

### WebSocket Connection

Connect to real-time health monitoring:

```javascript
const socket = io('http://localhost:3001/ws/health')

socket.on('health_status', data => {
  console.log('Health status:', data)
})

socket.on('service_status_change', data => {
  console.log('Service status changed:', data)
})
```

## Key Features

### NestJS Framework Benefits

- **Decorator-based Architecture**: Clean, declarative code with decorators
- **Dependency Injection**: Automatic service injection and management
- **Modular Structure**: Organized code with separate modules for each feature
- **Built-in Validation**: Request validation with class-validator
- **Type Safety**: Full TypeScript support with strict typing

### Swagger Integration

- **Automatic Documentation**: API docs generated from decorators
- **Interactive UI**: Test endpoints directly from the browser
- **OpenAPI 3.0**: Standard-compliant API specification
- **Type-safe DTOs**: Request/response validation with Swagger decorators

### Real-time Features

- **WebSocket Support**: Real-time health monitoring and status updates
- **Event Streaming**: Live updates from KurrentDB streams
- **Health Broadcasting**: Automatic health status broadcasting to connected clients

## Testing

- Unit tests for all NestJS services and controllers
- Integration tests for database operations
- E2E tests for API endpoints
- WebSocket connection testing
- Swagger documentation validation

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Lint code
npm run lint
```

## Next Steps

- Implement advanced querying capabilities
- Add comprehensive error handling and logging
- Implement backup and recovery mechanisms
- Add monitoring and analytics dashboards
- **Production Deployment**: Configure production environment variables
- Add authentication and authorization
- Implement rate limiting and security measures
