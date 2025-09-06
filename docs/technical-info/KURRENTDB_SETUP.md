# KurrentDB Setup Guide

This guide will help you set up a KurrentDB instance using Docker on macOS.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose available

## Quick Start

### Option 1: Using npm scripts (Recommended)

1. **Start KurrentDB and your development server:**

   ```bash
   npm run dev:kurrentDB
   ```

   This will start KurrentDB and then launch your Vue.js development server.

2. **Or start KurrentDB separately:**

   ```bash
   npm run kurrenDB:start
   ```

3. **Check Status:**

   ```bash
   npm run kurrenDB:status
   ```

4. **View Logs:**

   ```bash
   npm run kurrenDB:logs
   ```

5. **Access Admin UI:**
   Open your browser and navigate to: http://localhost:2113

### Option 2: Using Docker Compose directly

1. **Start KurrentDB:**

   ```bash
   docker-compose up -d
   ```

2. **Check Status:**

   ```bash
   docker-compose ps
   ```

3. **View Logs:**

   ```bash
   docker-compose logs -f kurrentdb
   ```

4. **Access Admin UI:**
   Open your browser and navigate to: http://localhost:2113

## Default Credentials

| User  | Password |
| ----- | -------- |
| admin | changeit |
| ops   | changeit |

## Connection Information

- **HTTP API:** http://localhost:2113
- **gRPC:** localhost:1113
- **Connection String:** kurrentdb://localhost:2113

## Features Enabled

- ✅ Projections enabled
- ✅ AtomPub over HTTP enabled
- ✅ Single-node cluster
- ✅ Health checks
- ✅ Persistent data storage

## Stopping KurrentDB

```bash
docker-compose down
```

To remove all data:

```bash
docker-compose down -v
```

## Troubleshooting

If you encounter issues:

1. Check if Docker is running
2. Verify ports 2113 and 1113 are available
3. Check logs: `docker-compose logs kurrentdb`
4. Restart the service: `docker-compose restart kurrentdb`

## Next Steps

Once KurrentDB is running, you can:

- Explore the Admin UI at http://localhost:2113
- Create streams and events
- Set up projections
- Configure authentication and security
- Integrate with your application

## Available npm Scripts

```bash
# Start KurrentDB and development server
npm run dev:kurrenDB

# Start only KurrentDB
npm run kurrenDB:start

# Stop KurrentDB
npm run kurrenDB:stop

# Restart KurrentDB
npm run kurrenDB:restart

# View KurrentDB logs
npm run kurrenDB:logs

# Check KurrentDB status
npm run kurrenDB:status
```

## Useful Docker Commands

```bash
# Check container status
docker-compose ps

# View real-time logs
docker-compose logs -f kurrentdb

# Execute commands in container
docker-compose exec kurrentdb bash

# Restart service
docker-compose restart kurrentdb

# Stop and remove everything
docker-compose down -v
```
