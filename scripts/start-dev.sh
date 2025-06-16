#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Cents Per Point development environment...${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL is not installed. Please install it first.${NC}"
    echo "For macOS: brew install postgresql@15"
    echo "For Ubuntu: sudo apt-get install postgresql-15"
    exit 1
fi

# Start PostgreSQL if not running
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo -e "${GREEN}Starting PostgreSQL...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql@15
    else
        sudo service postgresql start
    fi
fi

# Create database if it doesn't exist
echo -e "${GREEN}Setting up database...${NC}"
psql -U postgres -c "CREATE DATABASE cpp_database;" 2>/dev/null || true

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}No .env file found. Using default values.${NC}"
    export DB_PASSWORD=securepassword123
fi

# Start backend
echo -e "${GREEN}Starting backend...${NC}"
cd backend
npm install
npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend
echo -e "${GREEN}Starting frontend...${NC}"
cd frontend-vite
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

# Function to handle script termination
cleanup() {
    echo -e "\n${GREEN}Shutting down services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap for cleanup on script termination
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}Development environment is running!${NC}"
echo -e "Frontend: ${YELLOW}http://localhost:3000${NC}"
echo -e "Backend: ${YELLOW}http://localhost:5001${NC}"
echo -e "Press Ctrl+C to stop all services"

# Keep script running
wait 