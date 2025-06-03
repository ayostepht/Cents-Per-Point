#!/bin/bash

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Please install it first:"
    echo "  - macOS: brew install postgresql@15"
    echo "  - Ubuntu: sudo apt-get install postgresql-15"
    exit 1
fi

# Check if PostgreSQL service is running
POSTGRES_WAS_RUNNING=true
if ! pg_isready &> /dev/null; then
    echo "PostgreSQL is not running. Starting it..."
    POSTGRES_WAS_RUNNING=false
    
    # Try to start PostgreSQL based on the OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start postgresql@15
    else
        # Linux
        sudo service postgresql start
    fi
    
    # Wait for PostgreSQL to start
    for i in {1..30}; do
        if pg_isready &> /dev/null; then
            echo "PostgreSQL started successfully!"
            break
        fi
        echo "Waiting for PostgreSQL to start... ($i/30)"
        sleep 1
    done
    
    if ! pg_isready &> /dev/null; then
        echo "Failed to start PostgreSQL. Please start it manually."
        exit 1
    fi
fi

# Create database if it doesn't exist
if ! psql -lqt | cut -d \| -f 1 | grep -qw cpp_database; then
    echo "Creating database cpp_database..."
    createdb cpp_database
fi

echo "PostgreSQL is ready!"

# Export whether we started PostgreSQL (for cleanup purposes)
if [ "$POSTGRES_WAS_RUNNING" = "false" ]; then
    exit 2  # Special exit code to indicate we started PostgreSQL
else
    exit 0  # Normal exit code - PostgreSQL was already running
fi 