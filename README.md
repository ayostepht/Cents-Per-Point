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

## 📸 Screenshots

### 📊 Dashboard - Analytics & Insights
Track your overall performance with comprehensive analytics and beautiful visualizations.

![Dashboard Overview](images/dashboard-screenshot.png)

### 📋 Redemptions Management
Easily manage all your point redemptions with powerful filtering and search capabilities.

![Redemptions Management](images/redemptions-screenshot.png)

### 🧮 CPP Calculator
Calculate Cents Per Point values instantly to make informed redemption decisions.

![CPP Calculator](images/calculator-screenshot.png)

## 🗺️ Roadmap

We're continuously improving Cents Per Point based on community feedback. Here's what's planned:

### 🎯 Near Term (Next 3-6 months)
- **Enhanced Analytics** - Advanced CPP trends, program performance insights, and custom report builder
- **Bulk Import/Export** - CSV import for bulk data entry and comprehensive export options

### 🚀 Medium Term (6-12 months)
- **Point Balance Tracking** - Monitor current balances and expiration dates across programs
- **Multi-User Support** - Family/household account management with shared tracking

### 💡 Long Term (12+ months)
- **Progressive Web App** - Mobile app experience with offline capabilities

> 💬 Have ideas for new features? [Open an issue](https://github.com/ayostepht/Cents-Per-Point/issues) to share your suggestions!

## 🚀 Quick Start

Get up and running in under 2 minutes:

```bash
# 1. Download the docker-compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/ayostepht/Cents-Per-Point/main/docker-compose.yml

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
   mkdir Cents-Per-Point && cd Cents-Per-Point
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
git clone https://github.com/ayostepht/Cents-Per-Point.git
cd Cents-Per-Point

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