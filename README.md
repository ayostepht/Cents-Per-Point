# Cost Per Point

A web application to track credit card point redemptions and calculate Cents Per Point (CPP) values to optimize your rewards strategy.

## ✨ Features

- **Track Redemptions**: Log point redemptions with dates, sources, values, and notes
- **Calculate CPP**: Automatically calculate Cents Per Point for each redemption
- **Compare Programs**: Analyze performance across different credit card and loyalty programs
- **Visualize Data**: Charts and analytics to understand your redemption patterns
- **Travel Credit Support**: Track both point redemptions and travel credit usage

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. Create a `docker-compose.yml` file:
```yaml
version: '3.8'
services:
  backend:
    image: stephtanner1/cpp-backend:latest
    ports:
      - "5000:5000"
    volumes:
      - backend_data:/app/data
  frontend:
    image: stephtanner1/cpp-frontend:latest
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  backend_data:
```

2. Start the application:
```bash
docker-compose up
```

3. Open [http://localhost:3000](http://localhost:3000)

### Using Docker CLI

```bash
# Create a volume for data persistence
docker volume create cpp_data

# Start backend
docker run -d --name cpp-backend -p 5000:5000 -v cpp_data:/app/data stephtanner1/cpp-backend:latest

# Start frontend  
docker run -d --name cpp-frontend -p 3000:80 stephtanner1/cpp-frontend:latest
```

## 📊 How It Works

### Adding Redemptions
1. **Enter Redemption Details**: Date, credit card/program source, points used, and cash value
2. **Add Taxes/Fees**: Include any taxes or fees paid out of pocket
3. **Add Notes**: Optional notes for context (e.g., "First class flight to Tokyo")

### CPP Calculation
The app automatically calculates your Cents Per Point value using:
```
CPP = (Cash Value - Taxes) ÷ Points × 100
```

### Travel Credits
Track travel credit usage separately from point redemptions to get accurate program performance metrics.

### Analytics
- View redemption history and trends
- Compare performance across different programs
- Identify your best and worst value redemptions

## 🎯 Optimization Tips

- **Good CPP Values**: Generally 1.5+ cents per point
- **Excellent CPP Values**: 2.0+ cents per point for premium programs
- **Track Everything**: Include taxes and fees for accurate calculations
- **Compare Programs**: Use data to focus on your highest-value programs

## 🛠️ Tech Stack

- **Frontend**: React + Vite with modern UI
- **Backend**: Node.js + Express API
- **Database**: SQLite for data persistence
- **Deployment**: Docker containers

## 📱 Supported Programs

Track redemptions from all major:
- **Credit Cards**: Chase, Amex, Citi, Capital One, and more
- **Airlines**: All major carriers and alliances
- **Hotels**: Marriott, Hilton, Hyatt, IHG, and more
- **Transfer Partners**: All major point transfer programs

## 🔒 Data Privacy

- All data is stored locally in your Docker container
- No data is transmitted to external services
- SQLite database for complete data control

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

**Questions or Issues?** Please open an issue on GitHub. 