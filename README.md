# Cents Per Point

[![Version](https://img.shields.io/badge/Version-0.2.1-green.svg)](https://github.com/stephtanner1/Cost%20Per%20Point/releases)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://hub.docker.com/u/stephtanner1)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://postgresql.org/)

> A self-hosted web application to track credit card point redemptions and calculate Cents Per Point (CPP) values to optimize your rewards strategy.

![Dashboard Overview](images/dashboard-screenshot.png)

## ✨ Features

- 📊 **Track & Analyze** - Log redemptions and calculate CPP with interactive analytics
- 📥 **Import/Export** - Bulk CSV import with smart column mapping and data validation
- 🎫 **Travel Credits** - Track both point redemptions and travel credit usage
- 📈 **Visual Analytics** - Professional charts with continuous trend lines and clean time-series data
- 🔒 **Privacy First** - All data stored locally, no external transmission
- 🐳 **Docker Ready** - Easy deployment with PostgreSQL and automatic SQLite migration

## 🚀 Quick Start

**Step 1:** Create a `.env` file with your database password:
```bash
echo "DB_PASSWORD=your-secure-password" > .env
```

**Step 2:** Download and start:
```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/stephtanner1/Cost%20Per%20Point/main/docker-compose.yml
docker-compose up -d
```

**Step 3:** Open your browser:
```bash
# Local access
open http://localhost:3000

# Remote access (replace IP with your server's IP)
open http://192.168.0.100:3000
```

## 📦 Docker Compose Configuration

### Complete docker-compose.yml
```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: centsperpoint
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  backend:
    image: stephtanner1/cpp-backend:latest
    environment:
      - DB_PASSWORD=${DB_PASSWORD}
    ports:
      - "5000:5000"
    # Optional: Mount SQLite data if migrating from a previous sqlite version
    # volumes:
    #  - backend_data:/app/data 
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    image: stephtanner1/cpp-frontend:latest
    # Uncomment VITE_API_URL only if you change the backend port above
    # Replace YOUR_SERVER_IP with localhost (local) or your server's IP (remote)
    # Example: VITE_API_URL=http://192.168.0.100:8080
    # environment:
    #   - VITE_API_URL=http://YOUR_SERVER_IP:BACKEND_PORT
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
# backend_data: -- optional, uncomment if migrating from a previous sqlite version
```

### SQLite Migration
To migrate existing SQLite data:

1. Uncomment the volume lines in `docker-compose.yml` (lines marked with `# Optional`)
2. Add `ENABLE_SQLITE_MIGRATION=true` to your `.env` file
3. Run `docker-compose up -d`
4. Check logs: `docker-compose logs -f backend`

Migration is automatic and non-destructive (creates a backup).

## ⚙️ Configuration

### Default Ports
| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 5000 | http://localhost:5000/health |
| PostgreSQL | 5432 | Internal only |

### Custom Ports
To use different ports, edit the `ports` section in `docker-compose.yml`:
```yaml
ports:
  - "8080:5000"  # Backend now accessible on port 8080
```

**Important:** If you change the backend port, also uncomment and set `VITE_API_URL`:
```yaml
# In frontend service:
environment:
  - VITE_API_URL=http://localhost:8080     # For local access
  # - VITE_API_URL=http://192.168.0.100:8080  # For remote access
```

> **Note:** The frontend automatically detects Docker environments and constructs API URLs, but custom backend ports require explicit `VITE_API_URL` configuration.

### Environment Variables
**Required:** Create a `.env` file with your database password:
```bash
DB_PASSWORD=your-secure-password
```

**Optional:** For SQLite migration only:
```bash
ENABLE_SQLITE_MIGRATION=true
```

> **Remote Access:** Works automatically via your server's IP address (e.g., `http://192.168.0.100:3000`). The frontend automatically detects the environment and constructs the correct API URLs.

## �� API Reference

### Redemptions
- `GET /api/redemptions` - List all redemptions
- `POST /api/redemptions` - Create new redemption
- `PUT /api/redemptions/:id` - Update redemption
- `DELETE /api/redemptions/:id` - Delete redemption

### Import/Export
- `GET /api/import-export/export` - Export CSV
- `GET /api/import-export/template` - Download template
- `POST /api/import-export/analyze` - Analyze CSV structure
- `POST /api/import-export/import` - Import with mapping

**Example:**
```bash
# Export data (local)
curl http://localhost:5000/api/import-export/export -o backup.csv

# Export data (remote - replace with your server IP)
curl http://192.168.0.100:5000/api/import-export/export -o backup.csv

# Create redemption
curl -X POST http://localhost:5000/api/redemptions \
  -H "Content-Type: application/json" \
  -d '{"date":"2024-01-15","source":"Chase","points":50000,"value":750}'
```

## 🗺️ Roadmap

**Near Term:** Advanced analytics dashboard, enhanced import formats  
**Medium Term:** Point balance tracking, multi-user support  
**Long Term:** Progressive web app, API integrations

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Test locally: `docker-compose up --build`
4. Submit pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License & Support

Licensed under MIT License. See [LICENSE](LICENSE) for details.

- 🐛 **Issues & Features**: [GitHub Issues](https://github.com/stephtanner1/Cost%20Per%20Point/issues)
- 📖 **Detailed Docs**: [Deployment Guide](DEPLOYMENT.md)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ for the points and miles community

</div>