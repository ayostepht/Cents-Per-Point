# Server Deployment Instructions

## Problem
When running the Docker containers on a server (not locally), the frontend can't connect to the backend because it's trying to reach `localhost:5000`, which refers to the user's local machine, not your server.

## Solution
The frontend now automatically detects the host and uses the same hostname for API calls. No configuration needed!

## How it works
- **Development** (localhost): Frontend at `http://localhost:3000` → API at `http://localhost:5000`
- **Production** (your server): Frontend at `http://yourserver.com:3300` → API at `http://yourserver.com:5000`

The frontend automatically uses `window.location.hostname` to determine the correct API URL.

## Steps to Deploy

### 1. Rebuild and push the frontend image
Since the frontend code has been updated:

```bash
# Build the new frontend image
docker build -t stephtanner1/cpp-frontend:beta ./frontend-vite

# Push to Docker Hub
docker push stephtanner1/cpp-frontend:beta
```

### 2. Deploy on your server
```bash
# Pull the latest images
docker-compose pull

# Stop existing containers
docker-compose down

# Start the containers
docker-compose up -d
```

That's it! No environment variables or configuration needed.

## Requirements
- Frontend accessible on port 3300
- Backend accessible on port 5000
- Both services running on the same host/domain

## Verification
After deployment:
1. Open your browser's developer tools
2. Go to the Network tab
3. Try to save a redemption
4. You should see API calls going to `http://yourserver.com:5000` (not localhost)

## Why this works
- **Container-to-container**: Not needed since the frontend runs in the browser
- **Browser-to-server**: Automatically uses the same hostname as the frontend
- **No configuration**: Works out of the box for any deployment 