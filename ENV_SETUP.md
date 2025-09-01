# Environment Setup Guide

This guide explains how to set up the development environment for the KurrentDB integration.

## Prerequisites

- Node.js 20.19.0 or >=22.12.0
- Docker and Docker Compose
- npm or yarn package manager

## Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start KurrentDB**

   ```bash
   npm run kurrentDB:start
   ```

3. **Start development server**

   ```bash
   npm run dev:kurrentDB
   ```

4. **Open demo page**
   Navigate to `/kurrentDB-demo` to see the KurrentDB integration in action.

## Environment Variables

Create a `.env` file in the root directory:

```bash
# KurrentDB Configuration
VITE_KURRENT_DB_ENABLED=true
VITE_KURRENT_DB_ENVIRONMENT=dev

# Development Environment Credentials
VITE_KURRENT_DB_DEV_API_KEY=admin
VITE_KURRENT_DB_DEV_SECRET_KEY=changeit

# Optional: Custom endpoints
VITE_KURRENT_DB_DEV_GRPC=localhost:1113
VITE_KURRENT_DB_DEV_HTTP=http://localhost:2113
VITE_KURRENT_DB_DEV_WS=ws://localhost:2113
```

## Docker Configuration

The project includes a `docker-compose.yaml` file that sets up KurrentDB:

```yaml
services:
  kurrentdb:
    image: docker.kurrent.io/kurrent-latest/kurrentdb:latest
    container_name: kurrentdb
    environment:
      - KURRENTDB_CLUSTER_SIZE=1
      - KURRENTDB_RUN_PROJECTIONS=All
      - KURRENTDB_START_STANDARD_PROJECTIONS=true
      - KURRENTDB_NODE_PORT=2113
      - KURRENTDB_INSECURE=true
      - KURRENTDB_ENABLE_ATOM_PUB_OVER_HTTP=true
    ports:
      - '2113:2113' # HTTP API
    volumes:
      - kurrentdb-volume-data:/var/lib/kurrentdb
      - kurrentdb-volume-logs:/var/log/kurrentdb
```

## Available Scripts

| Script                      | Description                     |
| --------------------------- | ------------------------------- |
| `npm run kurrentDB:start`   | Start KurrentDB container       |
| `npm run kurrentDB:stop`    | Stop KurrentDB container        |
| `npm run kurrentDB:restart` | Restart KurrentDB container     |
| `npm run kurrentDB:logs`    | View KurrentDB logs             |
| `npm run kurrentDB:status`  | Check container status          |
| `npm run dev:kurrentDB`     | Start dev server with KurrentDB |

## Connection Details

- **HTTP API**: http://localhost:2113
- **gRPC**: localhost:1113
- **WebSocket**: ws://localhost:2113
- **Default Credentials**: admin/changeit

## Testing

The mock client automatically activates in test environments:

```bash
# Run unit tests
npm run test:run

# Run tests with UI
npm run test:ui

# Run component tests
npm run test:component
```

## Troubleshooting

### KurrentDB Won't Start

1. Check if port 2113 is available:

   ```bash
   lsof -i :2113
   ```

2. Check Docker logs:

   ```bash
   npm run kurrentDB:logs
   ```

3. Verify Docker is running:
   ```bash
   docker --version
   docker-compose --version
   ```

### Connection Issues

1. Verify KurrentDB is running:

   ```bash
   npm run kurrentDB:status
   ```

2. Check environment variables:

   ```bash
   cat .env
   ```

3. Test connection manually:
   ```bash
   curl http://localhost:2113/health
   ```

### Build Issues

1. Clear cache:

   ```bash
   npm run clean
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## Development Workflow

1. **Start KurrentDB**: `npm run kurrentDB:start`
2. **Start dev server**: `npm run dev:kurrentDB`
3. **Make changes** to code
4. **Test changes** in browser
5. **Run tests**: `npm run test:run`
6. **Stop services**: `npm run kurrentDB:stop`

## Production Deployment

For production, update environment variables:

```bash
VITE_KURRENT_DB_ENVIRONMENT=mainnet
VITE_KURRENT_DB_MAINNET_API_KEY=your_api_key
VITE_KURRENT_DB_MAINNET_SECRET_KEY=your_secret_key
```

## Security Notes

- Never commit `.env` files to version control
- Use strong credentials in production
- Enable TLS in production environments
- Regularly rotate API keys and secrets
