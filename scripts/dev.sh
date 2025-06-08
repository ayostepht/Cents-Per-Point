#!/bin/bash

# Track whether we started PostgreSQL
POSTGRES_STARTED_BY_SCRIPT=false

# Function to handle script termination
cleanup() {
    echo "Shutting down services..."
    
    # Kill backend and frontend processes
    kill $(jobs -p) 2>/dev/null
    
    # If we started PostgreSQL, stop it
    if [ "$POSTGRES_STARTED_BY_SCRIPT" = "true" ]; then
        echo "Stopping PostgreSQL (started by this script)..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            brew services stop postgresql@15
        else
            # Linux
            sudo service postgresql stop
        fi
        echo "PostgreSQL stopped."
    else
        echo "PostgreSQL was already running before script started, leaving it running."
    fi
    
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Make scripts executable
chmod +x scripts/check-postgres.sh

# Check and start PostgreSQL
./scripts/check-postgres.sh
POSTGRES_EXIT_CODE=$?

if [ $POSTGRES_EXIT_CODE -eq 2 ]; then
    # PostgreSQL was started by our script
    POSTGRES_STARTED_BY_SCRIPT=true
    echo "PostgreSQL was started by this script - will be stopped on exit."
elif [ $POSTGRES_EXIT_CODE -eq 0 ]; then
    # PostgreSQL was already running
    POSTGRES_STARTED_BY_SCRIPT=false
    echo "PostgreSQL was already running - will be left running on exit."
else
    # Error starting PostgreSQL
    echo "Failed to start PostgreSQL"
    exit 1
fi

# Start backend
echo "Starting backend server..."
cd backend
npm install
NODE_ENV=development npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:5001/health > /dev/null; then
        echo "Backend is ready!"
        break
    fi
    echo "Waiting for backend... ($i/30)"
    sleep 1
done

# Start frontend
echo "Starting frontend server..."
cd ../frontend-vite
npm install
NODE_ENV=development npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo "Waiting for frontend to start..."
for i in {1..30}; do
    if curl -s http://localhost:5174 > /dev/null; then
        echo "Frontend is ready!"
        break
    fi
    echo "Waiting for frontend... ($i/30)"
    sleep 1
done

echo "All services are running!"
echo "Frontend: http://localhost:5174"
echo "Backend: http://localhost:5001"
if [ "$POSTGRES_STARTED_BY_SCRIPT" = "true" ]; then
    echo "PostgreSQL: Started by script (will be stopped when you exit)"
else
    echo "PostgreSQL: Was already running (will remain running when you exit)"
fi
echo "Press Ctrl+C to stop all services"

# Keep script running
wait 
