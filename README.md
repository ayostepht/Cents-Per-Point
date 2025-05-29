# Cost Per Point

A web application to track credit card point redemptions and calculate Cents Per Point (CPP) values to optimize your rewards strategy.

## ✨ Features

- **Track Redemptions**: Log point redemptions with dates, sources, values, and notes
- **Calculate CPP**: Automatically calculate Cents Per Point for each redemption
- **Compare Programs**: Analyze performance across different credit card and loyalty programs
- **Visualize Data**: Charts and analytics to understand your redemption patterns
- **Comprehensive Coverage**: Supports all major credit cards, airlines, and hotel programs

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. Create a `docker-compose.yml` file:
```yaml
version: '3.8'
services:
  backend:
    image: stephtanner1/cpp-backend:latest
    ports:
      - "5000:5000"
  frontend:
    image: stephtanner1/cpp-frontend:latest
    ports:
      - "3000:3000"
```

2. Run the application:
```bash
docker-compose up
```

3. Open [http://localhost:3000](http://localhost:3000)

### Option 2: Docker CLI

```bash
# Start backend
docker run -d --name cpp-backend -p 5000:5000 stephtanner1/cpp-backend:latest

# Start frontend  
docker run -d --name cpp-frontend -p 3000:3000 stephtanner1/cpp-frontend:latest
```

## 🏗️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd cost-per-point
```

2. **Start the backend**
```bash
cd backend
npm install
npm run dev
```

3. **Start the frontend** (in a new terminal)
```bash
cd frontend-vite
npm install
npm run dev
```

4. **Access the application**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:5000](http://localhost:5000)


## 📊 How It Works

1. **Add Redemptions**: Enter details about your point redemptions
2. **Automatic CPP Calculation**: The app calculates (Cash Value - Taxes) ÷ Points × 100
3. **Compare Against Benchmarks**: See how your redemptions compare to commonly accepted values
4. **Track Performance**: Visualize your redemption history and identify the best value programs

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Deployment**: Docker


## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

**Questions or Issues?** Please open an issue on GitHub. 