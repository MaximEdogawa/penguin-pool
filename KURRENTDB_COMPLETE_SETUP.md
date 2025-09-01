# Complete KurrentDB Setup Guide

This guide covers setting up a complete KurrentDB system with:

1. **Frontend**: Vue.js app with HTTP-based KurrentDB client
2. **Backend**: Node.js service with gRPC KurrentDB client
3. **Database**: KurrentDB instance running in Docker

## Architecture Overview

```
Frontend (Vue.js) ←→ Backend (Node.js) ←→ KurrentDB (gRPC)
     ↓                    ↓                    ↓
  HTTP API           gRPC Client         Event Store
  (Browser)          (Backend)          (Database)
```

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- Git

## Quick Start

### 1. Start the Complete System

```bash
# Clone the repository
git clone <your-repo>
cd penguin-pool

# Start the complete system (KurrentDB + Backend)
cd backend
docker-compose up -d

# Start the frontend
cd ..
npm run dev
```

### 2. Access the Services

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **KurrentDB Admin**: http://localhost:2113
- **Demo Page**: http://localhost:5173/websocket-demo

## Detailed Setup

### Frontend Configuration

The frontend now uses HTTP to communicate with the backend service. Update your `.env` file:

```bash
# Frontend .env
VITE_API_BASE_URL=http://localhost:3000
VITE_KURRENT_DB_ENABLED=true
VITE_KURRENT_DB_ENVIRONMENT=dev
```

### Backend Configuration

The backend service connects to KurrentDB via gRPC. Environment variables:

```bash
# Backend .env
NODE_ENV=production
PORT=3000

# KurrentDB Connection
KURRENTDB_HOST=127.0.0.1
KURRENTDB_PORT=2113
KURRENTDB_API_KEY=demo-key
KURRENTDB_SECRET_KEY=demo-secret
KURRENTDB_USE_TLS=false
KURRENTDB_VERIFY_CERT=false

# Security
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Docker Deployment

#### Option 1: Complete Stack (Recommended)

```bash
cd backend
docker-compose up -d
```

This starts:

- KurrentDB database on port 2113
- Backend API on port 3000
- Nginx reverse proxy on ports 80/443

#### Option 2: Individual Services

```bash
# Start only KurrentDB
docker-compose up -d kurrentdb

# Start only backend
docker-compose up -d backend

# Start only nginx
docker-compose up -d nginx
```

## API Endpoints

### Health Check

- `GET /health` - Service health status
- `GET /api/health` - Database health check

### Streams

- `GET /api/streams` - List all streams
- `POST /api/streams` - Create new stream
- `GET /api/streams/:id` - Get stream details
- `PUT /api/streams/:id` - Update stream
- `DELETE /api/streams/:id` - Delete stream

### Users

- `POST /api/users/data` - Store user data
- `GET /api/users/:id/data` - Get user data
- `PUT /api/users/:id/data` - Update user data
- `DELETE /api/users/:id/data` - Delete user data

## Development Workflow

### 1. Local Development

```bash
# Terminal 1: Start KurrentDB
cd backend
docker-compose up -d kurrentdb

# Terminal 2: Start Backend (with hot reload)
cd backend
npm run dev

# Terminal 3: Start Frontend
npm run dev
```

### 2. Testing

```bash
# Test backend
cd backend
npm test

# Test frontend
npm run test:unit

# Test complete system
npm run test:e2e
```

### 3. Building for Production

```bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build

# Build Docker images
cd backend
docker-compose build
```

## Production Deployment

### 1. Environment Variables

```bash
# Production .env
NODE_ENV=production
KURRENTDB_HOST=your-kurrentdb-host
KURRENTDB_PORT=2113
KURRENTDB_API_KEY=your-production-api-key
KURRENTDB_SECRET_KEY=your-production-secret-key
KURRENTDB_USE_TLS=true
KURRENTDB_VERIFY_CERT=true
```

### 2. Docker Production

```bash
# Build production images
docker-compose -f docker-compose.production.yml build

# Deploy to production
docker-compose -f docker-compose.production.yml up -d
```

### 3. Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n kurrentdb
kubectl get services -n kurrentdb
```

## Monitoring and Logging

### 1. Health Checks

```bash
# Check service health
curl http://localhost:3000/health

# Check database health
curl http://localhost:3000/api/health

# Check KurrentDB directly
curl http://localhost:2113/health
```

### 2. Logs

```bash
# Backend logs
docker-compose logs -f backend

# KurrentDB logs
docker-compose logs -f kurrentdb

# All logs
docker-compose logs -f
```

### 3. Metrics

```bash
# Get database metrics
curl http://localhost:3000/api/health/metrics

# Get cluster info
curl http://localhost:3000/api/health/cluster
```

## Troubleshooting

### Common Issues

#### 1. Connection Failed

```bash
# Check if KurrentDB is running
docker-compose ps kurrentdb

# Check KurrentDB logs
docker-compose logs kurrentdb

# Verify port accessibility
curl http://localhost:2113/health
```

#### 2. Backend Won't Start

```bash
# Check backend logs
docker-compose logs backend

# Verify environment variables
docker-compose exec backend env | grep KURRENTDB

# Check network connectivity
docker-compose exec backend ping kurrentdb
```

#### 3. Frontend Can't Connect

```bash
# Check backend health
curl http://localhost:3000/health

# Verify CORS settings
curl -H "Origin: http://localhost:5173" http://localhost:3000/health

# Check browser console for errors
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
docker-compose up backend

# Check detailed logs
docker-compose logs -f backend | grep DEBUG
```

## Security Considerations

### 1. Authentication

- Use strong API keys for production
- Implement JWT tokens for user authentication
- Use HTTPS in production

### 2. Network Security

- Restrict database access to backend only
- Use internal Docker networks
- Implement rate limiting

### 3. Data Protection

- Encrypt sensitive data before storing
- Implement proper access controls
- Regular security audits

## Performance Optimization

### 1. Database

- Use connection pooling
- Implement caching strategies
- Monitor query performance

### 2. Backend

- Enable compression
- Implement request caching
- Use load balancing for high traffic

### 3. Frontend

- Implement lazy loading
- Use service workers for caching
- Optimize bundle size

## Scaling

### 1. Horizontal Scaling

```bash
# Scale backend services
docker-compose up -d --scale backend=3

# Use load balancer
docker-compose up -d nginx
```

### 2. Database Clustering

```bash
# Use KurrentDB cluster mode
KURRENTDB_CLUSTER_SIZE=3
KURRENTDB_INSECURE=false
```

### 3. Microservices

- Split backend into multiple services
- Use message queues for communication
- Implement circuit breakers

## Next Steps

1. **Implement Real-time Updates**: Use Server-Sent Events or WebSocket for live data
2. **Add Authentication**: Implement user management and JWT tokens
3. **Monitoring**: Add Prometheus metrics and Grafana dashboards
4. **CI/CD**: Set up automated testing and deployment pipelines
5. **Backup**: Implement automated database backup strategies

## Support

- **Documentation**: Check the docs/ folder
- **Issues**: Report bugs in the GitHub issues
- **Community**: Join the KurrentDB community
- **Support**: Contact the development team

## License

This project is licensed under the MIT License - see the LICENSE file for details.
