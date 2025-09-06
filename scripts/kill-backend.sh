#!/bin/bash

# Script to kill all running NestJS backend services
# This script will terminate all Node.js processes related to the backend

echo "🔍 Searching for running NestJS backend services..."

# Find and kill Node.js processes that are running NestJS
# This targets processes with 'nest' in the command line, backend dist/main, or penguin-pool backend
PIDS=$(pgrep -f "backend/dist/main" 2>/dev/null)
NEST_PIDS=$(pgrep -f "nest" 2>/dev/null)
NODE_BACKEND_PIDS=$(pgrep -f "node.*backend" 2>/dev/null)

# Combine all PIDs
ALL_PIDS="$PIDS $NEST_PIDS $NODE_BACKEND_PIDS"
# Remove duplicates and empty entries
PIDS=$(echo $ALL_PIDS | tr ' ' '\n' | sort -u | tr '\n' ' ' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

if [ -z "$PIDS" ]; then
    echo "✅ No running NestJS backend services found."
    exit 0
fi

echo "📋 Found the following NestJS processes:"
ps -p $PIDS -o pid,ppid,command

echo ""
echo "🛑 Terminating NestJS backend services..."

# Kill the processes
for PID in $PIDS; do
    echo "   Killing process $PID..."
    kill -TERM $PID 2>/dev/null
done

# Wait a moment for graceful shutdown
sleep 2

# Check if any processes are still running and force kill if necessary
REMAINING_PIDS=$(pgrep -f "nest\|node.*backend\|node.*dist/main" 2>/dev/null)
if [ ! -z "$REMAINING_PIDS" ]; then
    echo "⚠️  Some processes didn't terminate gracefully, force killing..."
    for PID in $REMAINING_PIDS; do
        echo "   Force killing process $PID..."
        kill -KILL $PID 2>/dev/null
    done
fi

# Final check
FINAL_CHECK=$(pgrep -f "backend/dist/main" 2>/dev/null)
FINAL_NEST_CHECK=$(pgrep -f "nest" 2>/dev/null)
FINAL_NODE_BACKEND_CHECK=$(pgrep -f "node.*backend" 2>/dev/null)
FINAL_ALL_CHECK="$FINAL_CHECK $FINAL_NEST_CHECK $FINAL_NODE_BACKEND_CHECK"
FINAL_CHECK=$(echo $FINAL_ALL_CHECK | tr ' ' '\n' | sort -u | tr '\n' ' ' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
if [ -z "$FINAL_CHECK" ]; then
    echo "✅ All NestJS backend services have been terminated successfully."
else
    echo "❌ Some processes may still be running. Manual intervention may be required."
    echo "Remaining processes:"
    ps -p $FINAL_CHECK -o pid,ppid,command
fi

# Also kill any processes running on common backend ports (3000, 3001, 3002)
echo ""
echo "🔍 Checking for processes on backend ports (3000, 3001, 3002)..."

for PORT in 3000 3001 3002; do
    PORT_PID=$(lsof -ti:$PORT 2>/dev/null)
    if [ ! -z "$PORT_PID" ]; then
        echo "   Found process $PORT_PID on port $PORT, terminating..."
        kill -TERM $PORT_PID 2>/dev/null
        sleep 1
        # Force kill if still running
        if kill -0 $PORT_PID 2>/dev/null; then
            kill -KILL $PORT_PID 2>/dev/null
        fi
    fi
done

echo "✅ Backend cleanup complete!"
