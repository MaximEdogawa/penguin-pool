# Backend Management Scripts

This directory contains scripts to help manage the NestJS backend services.

## Available Scripts

### `kill-backend.sh` (Linux/macOS)

Terminates all running NestJS backend services and processes on common backend ports.

**Usage:**

```bash
# From project root
./scripts/kill-backend.sh

# Or using npm script
npm run kill-backend

# From backend directory
npm run kill
```

**What it does:**

- Finds all Node.js processes running NestJS
- Terminates them gracefully (SIGTERM)
- Force kills any that don't terminate (SIGKILL)
- Cleans up processes on ports 3000, 3001, 3002
- Provides detailed output of what's being terminated

### `kill-backend.bat` (Windows)

Windows equivalent of the kill script.

**Usage:**

```cmd
scripts\kill-backend.bat
```

## When to Use

Use these scripts when:

- Backend services are stuck or unresponsive
- You need to free up ports 3000, 3001, or 3002
- You want to ensure a clean restart of all backend services
- Development servers are running in the background and you want to stop them

## Safety

These scripts are designed to be safe and will:

- Show you what processes will be terminated before killing them
- Attempt graceful shutdown first
- Only force kill if necessary
- Provide clear feedback about what's happening
