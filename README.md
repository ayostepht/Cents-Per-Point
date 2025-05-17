# Cents Per Point

A self-hosted web application to track and visualize credit card point redemptions, helping you understand and optimize your Cents Per Point (CPP).

## Overview
- **Backend:** Node.js (Express, SQLite)
- **Frontend:** React
- **Database:** SQLite (local file)
- **Deployment:** Docker Compose or Docker CLI

## Features
- Add and view point redemptions (date, source, points, value, notes)
- Calculate and visualize CPP (overall, by source, over time)
- Compare CPP between sources (e.g., Amex, Chase)

## Quick Start

### Docker Compose
Use the following `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    image: stephtanner1/cpp-backend:latest
    ports:
      - "5000:5000" #API & 
  frontend:
    image: stephtanner1/cpp-frontend:latest
    ports:
      - "3000:3000" #UI Port
```

1. Save the above as `docker-compose.yml` in an empty directory.
2. Run:
   ```sh
   docker-compose up
   ```
Access the app at [http://localhost:3000](http://localhost:3000)

> **Note:** This will pull pre-built images from Docker Hub (`stephtanner1/cpp-backend:latest` and `stephtanner1/cpp-frontend:latest`).

---

### Docker CLI
If you prefer to use Docker directly without Compose:
1. Run the backend:
   ```sh
   docker run -d --name cpp-backend -p 5000:5000 stephtanner1/cpp-backend:latest
   ```
2. Run the frontend:
   ```sh
   docker run -d --name cpp-frontend -p 3000:3000 stephtanner1/cpp-frontend:latest
   ```
3. Access the app at [http://localhost:3000](http://localhost:3000)

---

For questions or contributions, please open an issue or pull request. 