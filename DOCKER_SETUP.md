# Docker Setup Guide

This project supports multiple Docker configurations for different use cases:

## Production Deployment (Docker Hub Images)

**File:** `docker-compose.yml`

Uses pre-built images from Docker Hub for production deployment:
- `stephtanner1/cpp-backend:latest`
- `stephtanner1/cpp-frontend:latest`

```bash
# Start production containers
docker-compose up

# Stop containers
docker-compose down
```

## Local Development with Hot Reloading

**File:** `docker-compose.dev.yml` (not tracked in git)

Provides a development environment with hot reloading for both frontend and backend:

```bash
# Start development environment (recommended)
./dev-local.sh

# Or manually:
docker-compose -f docker-compose.dev.yml up --build
```

Features:
- ✅ Hot reloading for both frontend and backend
- ✅ Source code mounted as volumes
- ✅ Vite dev server for frontend (port 3000)
- ✅ Nodemon for backend auto-restart

## Local Production Testing

**File:** `docker-compose.local.yml` (not tracked in git)

Builds production containers locally for testing before pushing to Docker Hub:

```bash
# Build and test production containers locally
./build-local.sh

# Or manually:
docker-compose -f docker-compose.local.yml up --build
```

## Docker Files Overview

### Production Dockerfiles (tracked in git)
- `backend/Dockerfile` - Production backend container
- `frontend-vite/Dockerfile` - Production frontend container with nginx

### Development Dockerfiles (not tracked in git)
- `backend/Dockerfile.dev` - Development backend with nodemon
- `frontend-vite/Dockerfile.dev` - Development frontend with Vite dev server

## Environment Configuration

The application automatically handles different environments:

- **Development**: Uses Vite dev server and nodemon for hot reloading
- **Production**: Uses nginx for frontend and optimized Node.js for backend
- **API URL**: Always uses `http://localhost:5000` for browser requests

## Building and Pushing to Docker Hub

To update the Docker Hub images with your changes:

1. Test locally first:
   ```bash
   ./build-local.sh
   ```

2. Build and tag for Docker Hub:
   ```bash
   # Backend
   docker build -t stephtanner1/cpp-backend:latest ./backend
   docker push stephtanner1/cpp-backend:latest
   
   # Frontend
   docker build -t stephtanner1/cpp-frontend:latest ./frontend-vite
   docker push stephtanner1/cpp-frontend:latest
   ```

3. Deploy production:
   ```bash
   docker-compose pull  # Get latest images
   docker-compose up
   ```

## Troubleshooting

### Port Conflicts
- Development frontend: http://localhost:3000
- Production frontend: http://localhost:3000 (mapped from container port 80)
- Backend (both): http://localhost:5000

### Database Persistence
- Database files are stored in Docker volumes
- Volume `backend_data` persists across container restarts
- To reset database: `docker-compose down -v`

### Network Issues
- All configurations use `localhost:5000` for API calls
- Containers communicate internally via Docker networks
- Browser requests always go to host machine's localhost 