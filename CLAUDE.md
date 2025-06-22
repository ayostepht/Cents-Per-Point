# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cents Per Point** is a self-hosted web application for tracking credit card point redemptions and calculating Cents Per Point (CPP) values. It's a full-stack application with a React frontend, Node.js/Express backend, and PostgreSQL database, all containerized with Docker.

## Commands

### Backend Development (`/backend/`)
```bash
npm run dev        # Development server with nodemon
npm start          # Production server
npm run reset-db   # Reset database
npm run migrate-db # Run database migrations
```

### Frontend Development (`/frontend-vite/`)
```bash
npm run dev        # Vite development server
npm run build      # Production build  
npm run lint       # ESLint linting
npm run preview    # Preview production build
```

### Docker Development
```bash
# Production deployment
docker-compose up

# Development with local builds
docker-compose -f docker-compose.dev.yml up --build

# Local development scripts
./scripts/start-dev.sh    # Start development environment
./scripts/dev-stop.sh     # Stop development services
./scripts/check-postgres.sh  # Check PostgreSQL status
```

## Architecture

### Service Structure
- **Frontend** (`/frontend-vite/`): React 18 + Vite + Tailwind CSS SPA
- **Backend** (`/backend/`): Express API server with CORS and rate limiting
- **Database**: PostgreSQL 16 with automatic SQLite migration support
- **Deployment**: Docker Compose with Nginx for production

### API Structure
- `/api/redemptions` - CRUD operations for point redemptions
- `/api/trips` - Travel trip management  
- `/api/import-export` - CSV data import/export
- `/health` - Service health and migration status

### Frontend API Configuration
The frontend automatically detects its environment for API calls:
- **Development**: Uses `localhost:5001` 
- **Docker**: Uses environment variables (`VITE_API_URL`)
- **Production**: Auto-detects based on hostname

### Database Architecture
- **Primary**: PostgreSQL with versioned migrations
- **Legacy Support**: Automatic one-time SQLite migration via `ENABLE_SQLITE_MIGRATION=true`
- **Models**: Redemptions and Trips with relational integrity

## Port Configuration

Default ports (all configurable via environment variables):
- Frontend: 3000 (`FRONTEND_PORT`)
- Backend: 5000 (`BACKEND_PORT`) 
- Development Backend: 5001 (avoids Apple Control Center conflicts)
- PostgreSQL: 5432 (`POSTGRES_PORT`)

## Key Technologies

### Frontend Stack
- React 18.2.0 with modern hooks
- Vite for fast builds and HMR
- Tailwind CSS 3.3.5 for styling
- React Router DOM 6.20.0 for routing
- Recharts 2.10.3 for analytics charts
- Axios 1.6.2 for HTTP requests

### Backend Stack  
- Node.js 18+ with Express 4.21.2
- PostgreSQL integration with pg library
- Multer for file uploads
- CSV parsing for data import/export
- Rate limiting and CORS security

## Development Notes

### Coding Best Practices
**CRITICAL: These practices must ALWAYS be followed before any commit:**

1. **Test All Changes Before Committing**
   - Run the application locally to verify changes work
   - Test modified functionality end-to-end
   - For path/configuration changes, verify with actual file system operations
   - Never commit untested code, especially for environment-specific changes (Docker, paths, etc.)

2. **Linting and Code Quality**
   - Always run `npm run lint` in both frontend and backend before committing
   - Fix ALL linting errors - never commit with linting failures
   - Ensure code follows project conventions and style guidelines

3. **Testing Requirements**
   - For backend changes: Test API endpoints with curl or similar tools
   - For frontend changes: Verify in browser with developer tools open
   - For Docker/deployment changes: Test in actual deployment environment
   - For database changes: Verify migrations work and data integrity is maintained

4. **Pre-Commit Checklist**
   - [ ] Code has been tested locally
   - [ ] All linting errors resolved (`npm run lint`)
   - [ ] No console errors in browser/server logs
   - [ ] Changes work in target environment (development/Docker)
   - [ ] Breaking changes documented in commit message

### Database Migrations
- Always use `npm run migrate-db` in backend after schema changes
- SQLite to PostgreSQL migration happens automatically on first run when enabled
- Health endpoint `/health` shows migration status

### Environment Variables
Required for development:
```bash
DB_PASSWORD=your-secure-password
POSTGRES_DB=centsperpoint
POSTGRES_USER=postgres
```

Optional:
```bash
ENABLE_SQLITE_MIGRATION=true  # For SQLite migration
FRONTEND_PORT=3000
BACKEND_PORT=5000  
POSTGRES_PORT=5432
```

### Testing Database Operations
Use the health endpoint `/health` to verify:
- Database connection status
- Migration completion status
- Service availability

## File Structure Context

- `/backend/src/index.js` - Main Express server entry point
- `/backend/src/routes/` - API route definitions
- `/backend/src/models/` - Database models and migrations
- `/frontend-vite/src/pages/` - React page components
- `/frontend-vite/src/components/` - Reusable React components
- `/docker-compose.yml` - Production Docker configuration
- `/docker-compose.dev.yml` - Development Docker configuration