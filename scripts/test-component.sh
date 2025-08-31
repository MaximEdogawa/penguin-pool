#!/bin/bash

echo "🧪 Running Playwright Component Tests..."

# Check if dev server is running
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "🚀 Starting dev server..."
    npm run dev &
    DEV_PID=$!
    
    # Wait for server to be ready
    echo "⏳ Waiting for dev server to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:5173 > /dev/null; then
            echo "✅ Dev server is ready!"
            break
        fi
        sleep 1
    done
    
    if [ $i -eq 30 ]; then
        echo "❌ Dev server failed to start within 30 seconds"
        kill $DEV_PID 2>/dev/null
        exit 1
    fi
fi

# Run component tests
echo "🔬 Running component tests..."
npm run test:component

# Clean up dev server if we started it
if [ ! -z "$DEV_PID" ]; then
    echo "🛑 Stopping dev server..."
    kill $DEV_PID 2>/dev/null
fi

echo "✅ Component tests completed!"
