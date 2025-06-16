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

```bash
# Download and start
curl -o docker-compose.yml https://raw.githubusercontent.com/stephtanner1/Cost%20Per%20Point/main/docker-compose.yml
docker-compose up -d

# Open your browser
open http://localhost:3000
```

## 📦 Installation & Migration

### New Installation
```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/stephtanner1/Cost%20Per%20Point/main/docker-compose.yml
docker-compose up -d
```

### Migrating from SQLite
If you have existing SQLite data, follow these steps:

1. **Prepare your data**
   - Ensure your SQLite database file is named `database.sqlite`
   - Place it in the `backend/data` directory of your project

2. **Configure Docker volumes**
   Uncomment the volume lines in `docker-compose.yml`:
   ```yaml
   # In backend service:
   volumes:
     - backend_data:/app/data  # Your volume name

   # In volumes section:
   volumes:
     postgres_data:
     backend_data:  # Your volume name
   ```

3. **Enable migration**
   Add the following to your `.env` file:
   ```bash
   ENABLE_SQLITE_MIGRATION=true
   ```

4. **Start the application**
   ```bash
   docker-compose up -d
   ```

5. **Verify migration**
   - Check the backend logs: `docker-compose logs -f backend`
   - Look for messages like "Successfully migrated X redemptions"
   - A backup of your SQLite database will be created as `database.sqlite.backup`

6. **After successful migration**
   - You can set `ENABLE_SQLITE_MIGRATION=false` or remove it from `.env`
   - The application will now use PostgreSQL exclusively

> **Note**: The migration process is one-way and non-destructive. Your original SQLite database remains unchanged, and a backup is created automatically.

## ⚙️ Configuration

| Service | Default Port | Description |
|---------|-------------|-------------|
| Frontend | 3000 | Web interface (can be mapped to different ports) |
| Backend | 5000 | REST API |
| PostgreSQL | 5432 | Database |
| Health Check | http://localhost:5000/health | Status & migration info |

### Environment Variables
Create a `.env` file in the project root with the following variables:

```bash
# Database Configuration (Required)
DB_PASSWORD=your-secure-password        # Used by both PostgreSQL and backend services

# PostgreSQL Service Configuration
POSTGRES_DB=cpp_database               # Database name
POSTGRES_USER=postgres                 # Database user
POSTGRES_PASSWORD=${DB_PASSWORD}       # References DB_PASSWORD

# Backend Service Configuration
DB_HOST=postgres                       # PostgreSQL service hostname
DB_NAME=cpp_database                   # Database name
DB_USER=postgres                       # Database user
DB_PASSWORD=${DB_PASSWORD}            # References DB_PASSWORD
DB_PORT=5432                          # Database port

# SQLite Migration (Optional)
ENABLE_SQLITE_MIGRATION=true          # Only set if migrating from SQLite
```

> **Important**: 
> - Set a secure `DB_PASSWORD` in your `.env` file
> - This password is used by both PostgreSQL and backend services
> - The default password is only for development
> - Port mappings can be customized in docker-compose.yml if needed

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