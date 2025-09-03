# KurrentDB Backend

Backend service for KurrentDB integration with Penguin Pool, built with NestJS.

## Features

- **Health Monitoring**: Comprehensive health checks for all services
- **Stream Management**: Full CRUD operations for event streams
- **Uptime Tracking**: Service uptime monitoring and statistics
- **KurrentDB Integration**: Proxy and direct integration with KurrentDB
- **WebSocket Support**: Real-time communication via WebSockets
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation with 100% coverage
- **Request Validation**: Automatic validation using class-validator
- **Error Handling**: Consistent error responses across all endpoints

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- KurrentDB instance running (default: http://localhost:2113)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Build the application
npm run build
```

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run start:prod

# Debug mode
npm run dev:debug
```

The application will be available at:

- **API**: http://localhost:3002
- **Swagger UI**: http://localhost:3002/api/docs

## API Documentation

### Built-in Swagger UI

The application automatically generates comprehensive API documentation using Swagger/OpenAPI 3.0 from your NestJS decorators.

#### View Documentation

**Interactive Swagger UI:**

1. Start the application: `npm run dev`
2. Open: http://localhost:3002/api/docs

**OpenAPI JSON Specification:**

- Raw OpenAPI spec: http://localhost:3002/api/docs-json

The Swagger UI provides:

- **Interactive API Explorer**: Test endpoints directly from the browser
- **Request/Response Examples**: See example payloads and responses
- **Schema Documentation**: View data models and validation rules
- **Parameter Documentation**: Complete parameter descriptions with examples
- **Error Response Documentation**: All possible error responses
- **Download OpenAPI Spec**: Export the OpenAPI specification as JSON

#### Using the Documentation

**For Development:**

- Use the interactive Swagger UI to test your API endpoints
- View request/response schemas for frontend integration
- Validate your API contracts
- Test all endpoints with real data

**For External Tools:**

- Import OpenAPI spec into Postman, Insomnia, or other API tools
- Generate client SDKs using OpenAPI Generator
- Share API contracts with frontend developers
- Use for API testing and validation

## API Endpoints

### Health Endpoints (`/health`)

- `GET /health` - Basic health check
- `GET /health/kurrentdb` - KurrentDB health check
- `GET /health/comprehensive` - Comprehensive system health

### Stream Management (`/api/streams`)

- `GET /api/streams/browse` - Browse all streams
- `GET /api/streams/:streamName/details` - Stream details
- `POST /api/streams/search` - Search events
- `GET /api/streams/statistics` - Stream statistics
- `POST /api/streams/create` - Create new stream
- `GET /api/streams/:streamName/events` - Read stream events
- `POST /api/streams/:streamName/events` - Append events
- `GET /api/streams/all/events` - Read from $all stream
- `GET /api/streams/health` - Stream health status

### Uptime Monitoring (`/api/uptime`)

- `GET /api/uptime/summary` - Uptime summary
- `GET /api/uptime/service/:serviceName` - Service uptime
- `GET /api/uptime/timeline/:serviceName` - Uptime timeline
- `GET /api/uptime/status` - Current statuses
- `GET /api/uptime/stats` - Uptime statistics
- `POST /api/uptime/check` - Manual status check

### KurrentDB Proxy (`/kurrentdb`)

- `GET /kurrentdb/*` - Proxy GET requests
- `POST /kurrentdb/*` - Proxy POST requests

### Status (`/api`)

- `GET /api/status` - API status

## API Statistics

- **Total Endpoints**: 21
- **API Modules**: 5 (Health, Streams, Uptime, KurrentDB, Status)
- **OpenAPI Version**: 3.0.0
- **Documentation Coverage**: 100%
- **Interactive Testing**: Available
- **Request Validation**: Automatic
- **Response Schemas**: Fully documented

## Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```env
# Server Configuration
HTTP_PORT=3001
WS_PORT=3002
NODE_ENV=development

# KurrentDB Configuration
KURRENTDB_URL=http://localhost:2113

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Swagger Configuration

The Swagger documentation is automatically generated from your NestJS decorators and configured in `src/main.ts`:

```typescript
const config = new DocumentBuilder()
  .setTitle('KurrentDB Backend API')
  .setDescription('Backend service for KurrentDB integration with Penguin Pool')
  .setVersion('1.0')
  .addTag('health', 'Health check endpoints')
  .addTag('streams', 'Stream management endpoints')
  .addTag('uptime', 'Service uptime monitoring endpoints')
  .addTag('kurrentdb', 'KurrentDB proxy endpoints')
  .addTag('status', 'API status endpoints')
  .build()

const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('api/docs', app, document)
```

## Development

### Project Structure

```
src/
├── app.module.ts          # Main application module
├── main.ts               # Application bootstrap
├── dto/                  # Data Transfer Objects
├── entities/             # Database entities
├── health/               # Health check module
├── kurrentdb/            # KurrentDB integration
├── services/             # Shared services
├── status/               # Status endpoints
├── streams/              # Stream management
├── uptime/               # Uptime monitoring
└── websocket/            # WebSocket gateway

docs/
└── *.md                  # Additional documentation
```

### Available Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run dev:debug        # Start with debug mode
npm run build            # Build for production
npm run start:prod       # Start production build

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:cov         # Run tests with coverage

# Code Quality
npm run lint             # Run ESLint
```

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

2. Add to module:

```typescript
@Module({
  controllers: [YourController],
  providers: [YourService],
})
export class YourModule {}
```

3. Import in `app.module.ts`

4. The Swagger documentation will automatically update when you restart the application

## Docker

### Build and Run

```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run
```

### Docker Compose

```bash
# Start with Docker Compose
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

## License

MIT License - see LICENSE file for details.
