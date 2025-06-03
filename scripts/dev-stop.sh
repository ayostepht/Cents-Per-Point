#!/bin/bash

echo "🛑 Stopping Cents Per Point Development Environment..."

# Stop any running Node.js processes (backend/frontend)
echo "🔌 Stopping Node.js processes..."
pkill -f "nodemon src/index.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Stop PostgreSQL container
echo "🐘 Stopping PostgreSQL container..."
docker-compose stop postgres

echo "✅ All services stopped!"
echo "💡 Run ./dev.sh to start the development environment again" 