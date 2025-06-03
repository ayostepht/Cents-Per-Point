# Cents Per Point

[![Version](https://img.shields.io/badge/Version-0.1.0-green.svg)](https://github.com/stephtanner1/Cost%20Per%20Point/releases)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://hub.docker.com/u/stephtanner1)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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
If you have existing SQLite data, uncomment the volume lines in `docker-compose.yml`:

```yaml
# In backend service:
volumes:
  - backend_data:/app/data  # Your volume name

# In volumes section:
volumes:
  postgres_data:
  backend_data:  # Your volume name
```

Then start: `docker-compose up -d`

The app automatically detects and migrates SQLite data to PostgreSQL.

## ⚙️ Configuration

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Web interface |
| Backend | 5000 | REST API |
| Health Check | http://localhost:5000/health | Status & migration info |

### Environment Variables
```bash
# Optional: Set custom password in .env file
DB_PASSWORD=your-secure-password
```

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