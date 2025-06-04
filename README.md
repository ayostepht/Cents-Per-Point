# Cents Per Point

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

1. Create a new directory for the project and create a `docker-compose.yml` file with the following content:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: cpp_database
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-securepassword123}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    image: stephtanner1/cpp-backend
    environment:
      DB_HOST: postgres
      DB_NAME: cpp_database
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD:-securepassword123}
      DB_PORT: 5432
    ports:
      - "5000:5000" # Change if port 5000 is already in use
    # Optional: Mount SQLite data if migrating from a previous sqlite version
    # volumes:
    #  - backend_data:/app/data 
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    image: stephtanner1/cpp-frontend
    # If using a custom backend port, uncomment and update:
    # environment:
    #   - VITE_BACKEND_URL=http://[serverip/hostname]:[port]
    # Example: VITE_BACKEND_URL=http://192.168.0.111:5001
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  # backend_data: # Uncomment if migrating from SQLite
```

2. Start the application:
```bash
docker-compose up -d
```

3. Access the application:
```bash
# Local installation
open http://localhost:3000

# Remote installation
open http://[server-ip]:3000
```

## 📦 Installation Options

### Basic Installation
1. Create a directory and add the `docker-compose.yml` file shown above
2. (Optional) Create a `.env` file to set a custom database password:
   ```bash
   DB_PASSWORD=your-secure-password
   ```
3. Start the application: `docker-compose up -d`

### Migrating from SQLite
If you have existing SQLite data:
1. Uncomment the volume lines in `docker-compose.yml`:
   ```yaml
   # In backend service:
   volumes:
     - backend_data:/app/data
   
   # In volumes section:
   volumes:
     postgres_data:
     backend_data:
   ```
2. Start the application: `docker-compose up -d`
3. The migration happens automatically on first run

## ⚙️ Port Configuration

By default, the application uses these ports:

| Service  | Port | Description    |
|----------|------|----------------|
| Frontend | 3000 | Web interface  |
| Backend  | 5000 | REST API       |
| Database | 5432 | PostgreSQL     |

### Customizing Backend Port

If port 5000 is already in use:

1. Change the port mapping in `docker-compose.yml`:
   ```yaml
   backend:
     ports:
       - "5001:5000"  # Host port 5001 maps to container port 5000
   ```

2. Update the frontend configuration:
   ```yaml
   frontend:
     environment:
       - VITE_BACKEND_URL=http://[serverip/hostname]:[port]
   ```
   
   Examples:
   - Local setup: `VITE_BACKEND_URL=http://localhost:5001`
   - Remote server: `VITE_BACKEND_URL=http://192.168.0.111:5001`

## 📚 API Reference

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
# Export data
curl http://localhost:5000/api/import-export/export -o backup.csv

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