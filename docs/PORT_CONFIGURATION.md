# Port Configuration

This application supports flexible port configuration through environment variables. You can customize the host ports while keeping the container ports consistent.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_PORT` | 5000 | Host port for backend API |
| `FRONTEND_PORT` | 3000 | Host port for frontend web interface |
| `POSTGRES_PORT` | 5432 | Host port for PostgreSQL database |

## Examples

### Default Configuration
```bash
# Uses default ports: frontend=3000, backend=5000, postgres=5432
docker-compose up -d
```

### Custom Host Ports
```bash
# Use custom host ports to avoid conflicts
export FRONTEND_PORT=8080
export BACKEND_PORT=8001
export POSTGRES_PORT=5433
docker-compose up -d
```

### Multiple Instances
```bash
# Instance 1
FRONTEND_PORT=3001 BACKEND_PORT=5001 POSTGRES_PORT=5433 docker-compose up -d

# Instance 2 (different project directory)
FRONTEND_PORT=3002 BACKEND_PORT=5002 POSTGRES_PORT=5434 docker-compose up -d
```

### Environment File
Create a `.env` file in your project root:
```env
# Custom ports
FRONTEND_PORT=8080
BACKEND_PORT=8001
POSTGRES_PORT=5433

# Database password
DB_PASSWORD=your-secure-password
```

## Port Mapping Format

The docker-compose files use the format: `${HOST_PORT}:${CONTAINER_PORT}`

- **Host Port**: Port on your machine (configurable)
- **Container Port**: Port inside the Docker container (usually fixed)

## Access URLs

After starting with custom ports:
- **Frontend**: `http://localhost:${FRONTEND_PORT}`
- **Backend API**: `http://localhost:${BACKEND_PORT}`
- **Database**: `localhost:${POSTGRES_PORT}` (for external connections)

## Notes

- Container internal ports are fixed (backend: 5000, frontend: 3000, postgres: 5432)
- Only the host ports (left side of mapping) are configurable
- The frontend automatically connects to the correct backend port via environment variables
- Health checks and inter-service communication use the fixed container ports
- All docker-compose files support the same port configuration system 