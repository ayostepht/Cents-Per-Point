# Cents Per Point

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://hub.docker.com/u/stephtanner1)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)

> A self-hosted web application to track credit card point redemptions and calculate Cents Per Point (CPP) values to optimize your rewards strategy.

![Cents Per Point Dashboard](https://via.placeholder.com/800x400/f8f9fa/6c757d?text=Cost+Per+Point+Dashboard)

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Development](#-development)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

## ✨ Features

- 📊 **Track Redemptions** - Log point redemptions with dates, sources, values, and notes
- 🧮 **Calculate CPP** - Automatically calculate Cents Per Point for each redemption
- 📈 **Compare Programs** - Analyze performance across different credit card and loyalty programs
- 📉 **Visualize Data** - Interactive charts and analytics to understand redemption patterns
- 🎫 **Travel Credit Support** - Track both point redemptions and travel credit usage
- 🔒 **Privacy First** - All data stored locally, no external data transmission
- 🐳 **Docker Ready** - Easy deployment with Docker Compose
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices


## 🚀 Quick Start

Get up and running in under 2 minutes:

```bash
# 1. Download the docker-compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/yourusername/cost-per-point/main/docker-compose.yml

# 2. Start the application
docker-compose up -d

# 3. Open your browser
open http://localhost:3000
```

That's it! 🎉

## 📦 Installation

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- 2GB RAM minimum
- 1GB free disk space

### Method 1: Docker Compose (Recommended)

1. **Create a project directory:**
   ```bash
   mkdir cost-per-point && cd cost-per-point
   ```

2. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     backend:
       image: stephtanner1/cpp-backend:latest
       ports:
         - "5000:5000"
       volumes:
         - backend_data:/app/data
       restart: unless-stopped
     frontend:
       image: stephtanner1/cpp-frontend:latest
       ports:
         - "3000:3000"
       depends_on:
         - backend
       restart: unless-stopped

   volumes:
     backend_data:
   ```

3. **Start the services:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Method 2: Docker CLI

```bash
# Create a volume for data persistence
docker volume create cpp_data

# Start backend
docker run -d \
  --name cpp-backend \
  -p 5000:5000 \
  -v cpp_data:/app/data \
  --restart unless-stopped \
  stephtanner1/cpp-backend:latest

# Start frontend
docker run -d \
  --name cpp-frontend \
  -p 3000:3000 \
  --restart unless-stopped \
  stephtanner1/cpp-frontend:latest
```

### Method 3: From Source

```bash
# Clone the repository
git clone https://github.com/yourusername/cost-per-point.git
cd cost-per-point

# Start with Docker Compose
docker-compose up -d
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `production` | No |
| `PORT` | Backend port | `5000` | No |

### Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Web interface |
| Backend | 5000 | REST API |

### Data Persistence

- **Database**: SQLite database stored in Docker volume `backend_data`
- **Location**: `/app/data/database.sqlite` inside the container
- **Backup**: Volume persists across container restarts

## 📖 Usage

### Adding Your First Redemption

1. Navigate to the **Redemptions** page
2. Click **Add Redemption**
3. Fill in the details:
   - **Date**: When you redeemed the points
   - **Source**: Credit card or loyalty program
   - **Points Used**: Number of points redeemed
   - **Cash Value**: Total value received
   - **Taxes/Fees**: Any out-of-pocket costs
   - **Notes**: Optional context

### Understanding CPP

The app calculates Cents Per Point using:
```
CPP = (Cash Value - Taxes) ÷ Points × 100
```

**Good Values:**
- 1.5+ cents per point: Good redemption
- 2.0+ cents per point: Excellent redemption
- 2.5+ cents per point: Outstanding redemption

### Supported Programs

- **Credit Cards**: Chase UR, Amex MR, Citi ThankYou, Capital One, and more
- **Airlines**: All major US and international carriers
- **Hotels**: Marriott, Hilton, Hyatt, IHG, and more
- **Transfer Partners**: All major point transfer programs

## 🛠️ Development

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/cost-per-point.git
   cd cost-per-point
   ```

2. **Start development environment:**
   ```bash
   # Create development docker-compose file (not tracked in git)
   # Copy from docker-compose.yml and modify for development
   docker-compose -f docker-compose.dev.yml up --build
   ```

3. **Access development servers:**
   - Frontend: http://localhost:3000 (Vite dev server)
   - Backend: http://localhost:5000 (Nodemon auto-restart)

### Project Structure

```
cost-per-point/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── index.js        # Main server file
│   └── Dockerfile
├── frontend-vite/          # React + Vite frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── constants/      # App constants
│   └── Dockerfile
├── docker-compose.yml      # Production deployment
└── README.md
```

### Building from Source

```bash
# Build backend
docker build -t cpp-backend ./backend

# Build frontend
docker build -t cpp-frontend ./frontend-vite

# Test locally with custom compose file
docker-compose -f docker-compose.local.yml up --build
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### Redemptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/redemptions` | Get all redemptions |
| `POST` | `/redemptions` | Create new redemption |
| `PUT` | `/redemptions/:id` | Update redemption |
| `DELETE` | `/redemptions/:id` | Delete redemption |

#### Example Request

```bash
# Create a new redemption
curl -X POST http://localhost:5000/api/redemptions \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "source": "Chase Ultimate Rewards",
    "points": 50000,
    "value": 750,
    "taxes": 50,
    "notes": "Flight to Tokyo"
  }'
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5000

# Kill the process or change ports in docker-compose.yml
```

#### Database Issues
```bash
# Reset database (WARNING: This deletes all data)
docker-compose down -v
docker-compose up -d
```

#### Network Issues
- Ensure ports 3000 and 5000 are not blocked by firewall
- For server deployment, the frontend automatically detects the hostname
- Check Docker logs: `docker-compose logs`

#### Container Won't Start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Restart services
docker-compose restart
```

### Server Deployment

For deployment on a remote server:

1. **Firewall Configuration:**
   ```bash
   # Allow ports (Ubuntu/Debian)
   sudo ufw allow 3000
   sudo ufw allow 5000
   ```

2. **Reverse Proxy (Optional):**
   Use nginx or Traefik for SSL and custom domains

3. **Verification:**
   - Check API calls in browser dev tools
   - Should see requests to your server's IP/domain, not localhost

### Getting Help

1. Check the [Issues](https://github.com/yourusername/cost-per-point/issues) page
2. Review Docker logs: `docker-compose logs`
3. Verify system requirements are met
4. Try the troubleshooting steps above

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test locally: `docker-compose -f docker-compose.dev.yml up --build`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation as needed
- Test with both development and production Docker setups

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- 📖 **Documentation**: Check this README and inline code comments
- 🐛 **Bug Reports**: [Open an issue](https://github.com/yourusername/cost-per-point/issues)
- 💡 **Feature Requests**: [Open an issue](https://github.com/yourusername/cost-per-point/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/cost-per-point/discussions)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ for the points and miles community

[Report Bug](https://github.com/ayostepht/cents-per-point/issues) · [Request Feature](https://github.com/ayostepht/cents-per-point/issues) · [Documentation](https://github.com/ayostepht/cents-per-point/wiki)

</div>