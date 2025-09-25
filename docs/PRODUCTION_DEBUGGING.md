# Production Debugging Guide

## Quick Start

Enable debugging in production by setting these environment variables:

```bash
# .env.local or production environment
VITE_ENABLE_DEBUG=true
VITE_TANSTACK_DEBUG=true
```

## Available Debug Tools

Once enabled, these tools are available in the browser console:

### TanStack Query Client

```javascript
// Access the query client
window.__QUERY_CLIENT__

// Get all queries
window.__QUERY_CLIENT__.getQueryCache().getAll()

// Invalidate specific queries
window.__QUERY_CLIENT__.invalidateQueries(['walletConnect', 'balance'])
```

### Debug Utilities

```javascript
// Manual balance refresh
window.__MANUAL_BALANCE_REFRESH__()

// Test balance request directly
window.__TEST_BALANCE_REQUEST__()

// Test alternative wallet methods
window.__TEST_ALTERNATIVE_METHODS__()
```

## Common Debugging Tasks

### Check Query States

```javascript
// Check balance query
const balanceQuery = window.__QUERY_CLIENT__.getQueryCache().get(['walletConnect', 'balance'])
console.log('Balance Query:', balanceQuery.state)

// Check connection query
const connectionQuery = window.__QUERY_CLIENT__.getQueryCache().get(['walletConnect', 'connection'])
console.log('Connection State:', connectionQuery.state.data)
```

### Monitor Query Changes

```javascript
// Watch for wallet query updates
window.__QUERY_CLIENT__.getQueryCache().subscribe(event => {
  if (event.query.queryKey.includes('walletConnect')) {
    console.log('Wallet Query Update:', event.query.queryKey, event.query.state.status)
  }
})
```

## Important Notes

- **Vue DevTools**: Not available in production (browser extension required)
- **Console Logging**: Automatically enabled when debug mode is on
- **Performance**: Debug mode adds minimal overhead
- **Security**: Only enable when needed for troubleshooting

## Troubleshooting

1. **Queries not updating**: Check if `isFullyReady` is true in connection state
2. **Balance requests failing**: Use `window.__TEST_BALANCE_REQUEST__()` to test directly
3. **Race conditions**: Monitor query states and connection readiness
4. **Network issues**: Check browser Network tab for failed requests

## Disable Debugging

To disable debugging in production:

```bash
VITE_ENABLE_DEBUG=false
VITE_TANSTACK_DEBUG=false
```
