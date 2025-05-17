# Cost Per Point

A self-hosted web application to track and visualize credit card point redemptions, helping you understand and optimize your Cost Per Point (CPP).

## Overview
- **Backend:** Node.js (Express, SQLite)
- **Frontend:** React
- **Database:** SQLite (local file)
- **Deployment:** Docker Compose

## Features
- Add and view point redemptions (date, source, points, value, notes)
- Calculate and visualize CPP (overall, by source, over time)
- Compare CPP between sources (e.g., Amex, Chase)

## Quick Start

### Prerequisites
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

### Setup
1. Clone this repository:
   ```sh
   git clone https://github.com/yourusername/cost-per-point.git
   cd cost-per-point
   ```
2. Build and start the app:
   ```sh
   docker-compose up --build
   ```
3. Access the app at [http://localhost:3000](http://localhost:3000)

## Development
- Backend code: `backend/`
- Frontend code: `frontend/`

---

For questions or contributions, please open an issue or pull request. 