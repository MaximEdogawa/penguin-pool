# KurrentDB WebSocket Setup Guide

## Environment Configuration

To configure the WebSocket connection to your local KurrentDB instance, create a `.env` file in the root directory with the following settings:

```bash
# KurrentDB WebSocket Configuration
VITE_KURRENT_DB_ENABLED=true
VITE_KURRENT_DB_ENVIRONMENT=dev

# Local KurrentDB Instance
VITE_KURRENT_DB_LOCAL_HOST=127.0.0.1
VITE_KURRENT_DB_LOCAL_PORT=2113
VITE_KURRENT_DB_LOCAL_WS_PORT=2113
VITE_KURRENT_DB_LOCAL_HTTP_PORT=2113

# Authentication (for demo purposes)
VITE_KURRENT_DB_DEV_API_KEY=demo-key
VITE_KURRENT_DB_DEV_SECRET_KEY=demo-secret
```

## Docker Compose Configuration

Make sure your `docker-compose.yaml` exposes the correct ports for WebSocket connections:

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
      - KURRENTDB_ENABLE_WEBSOCKET=true # Enable WebSocket support
    ports:
      - '2113:2113' # HTTP API and WebSocket
    volumes:
      - type: volume
        source: kurrentdb-volume-data
        target: /var/lib/kurrentdb
      - type: volume
        source: kurrentdb-volume-logs
        target: /var/log/kurrentdb

volumes:
  kurrentdb-volume-data:
  kurrentdb-volume-logs:
```

## Starting the Services

1. **Start KurrentDB:**

   ```bash
   docker-compose up -d kurrentdb
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **Navigate to the WebSocket Demo:**
   ```
   http://localhost:5173/websocket-demo
   ```

## Connection Details

- **WebSocket URL:** `ws://127.0.0.1:2113`
- **HTTP URL:** `http://127.0.0.1:2113`
- **Authentication:** Basic auth with `demo-key:demo-secret`

## Fallback Mode

If the WebSocket connection fails, the system will automatically fall back to mock mode, which:

- Simulates real-time updates every 3 seconds
- Allows you to test the UI functionality
- Provides a realistic demo experience

## Troubleshooting

### WebSocket Connection Failed

1. Check if KurrentDB is running: `docker-compose ps`
2. Verify port 2113 is accessible: `curl http://127.0.0.1:2113`
3. Check KurrentDB logs: `docker-compose logs kurrentdb`

### Mock Mode Active

If you see "Running in mock mode" in the console, the WebSocket connection failed but the demo will still work with simulated real-time updates.

### Port Already in Use

If port 2113 is already in use, you can change it in both the `.env` file and `docker-compose.yaml`.

## Testing the WebSocket Connection

1. Open the WebSocket Demo page
2. Click "Connect to Database"
3. Watch the connection status indicators
4. Create some test streams to see real-time updates
5. Check the browser console for connection logs

## Next Steps

Once the WebSocket connection is working:

1. Replace demo credentials with real KurrentDB credentials
2. Configure production endpoints
3. Implement proper error handling and retry logic
4. Add WebSocket connection pooling for production use
