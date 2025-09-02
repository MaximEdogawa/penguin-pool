# Port Configuration Setup

This project now runs on the following ports:

## Port Configuration

- **Frontend (Vue.js App)**: Port 3000
- **Backend (HTTP API)**: Port 3001
- **WebSocket Server**: Port 3002

## Quick Start

### Option 1: Run All Services Together

```bash
npm run dev:all
```

### Option 2: Run Services Individually

#### Terminal 1: Frontend (Port 3000)

```bash
npm run dev
```

#### Terminal 2: Backend (Port 3001)

```bash
npm run dev:backend
```

#### Terminal 3: WebSocket (Port 3002)

```bash
npm run dev:websocket
```

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Server Ports
HTTP_PORT=3001
WS_PORT=3002

# KurrentDB Configuration
KURRENTDB_URL=http://localhost:2113
KURRENTDB_HOST=127.0.0.1
KURRENTDB_PORT=2113
KURRENTDB_API_KEY=demo-key
KURRENTDB_SECRET_KEY=demo-secret
KURRENTDB_USE_TLS=false
KURRENTDB_VERIFY_CERT=true

# Environment
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000
```

### Frontend Environment Variables

Update your `.env` file in the root directory:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
```

## Service URLs

- **Frontend**: http://localhost:3000
- **Backend Health**: http://localhost:3001/health
- **Database Health**: http://localhost:3001/health/kurrentdb
- **WebSocket**: ws://localhost:3002/ws/health
- **Service Health Page**: http://localhost:3000/service-health

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

1. Check what's running on the port:

   ```bash
   lsof -i :3000  # Frontend
   lsof -i :3001  # Backend
   lsof -i :3002  # WebSocket
   ```

2. Kill the process using the port:
   ```bash
   kill -9 <PID>
   ```

### WebSocket Connection Issues

- Ensure the backend is running on port 3001
- Check that the WebSocket server is running on port 3002
- Verify CORS settings allow connections from port 3000

### Backend Connection Issues

- Check that the backend is running on port 3001
- Verify the frontend is making requests to the correct port
- Check the browser console for CORS errors
