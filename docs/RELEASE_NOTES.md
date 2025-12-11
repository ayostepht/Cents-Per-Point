# Release Notes

## **Version 0.2.0** - Major Feature Release
*Released: June 2025*

### 🚀 **Major Features**

#### **CSV Import/Export System**
- **Complete CSV import/export functionality** for redemption data
- **Intelligent column mapping** with auto-suggestions based on header names
- **Advanced CSV parser** handling complex formats including split dollar amounts
- **Comprehensive validation** with error handling for date formats and missing data
- **Data preview** before import with step-by-step guidance
- **Export templates** for easy data entry

#### **Enhanced Dashboard Analytics**
- **Cleaner chart visualizations** with removed unnecessary legends
- **Continuous CPP line charts** with improved data connectivity
- **Smart date formatting** and intelligent label spacing
- **Fixed pie chart labels** with better positioning and readability
- **Enhanced tooltips** showing formatted data across all charts

#### **PostgreSQL Database Migration**
- **Full PostgreSQL support** replacing SQLite for production use
- **Automatic SQLite migration** for existing users
- **Memory-based file uploads** for Docker compatibility
- **Improved data integrity** and performance

### 🔧 **Technical Improvements**

#### **Security Updates**
- **CRITICAL**: Updated Multer 1.4.5-lts.1 → 2.0.0 (fixes CVE-2025-47944 & CVE-2025-47935)
- **Updated Express** 4.18.2 → 4.21.2
- **Updated PostgreSQL driver** 8.11.3 → 8.13.1
- **Updated dotenv** 16.3.1 → 16.4.7

#### **Docker & Deployment**
- **Fixed CORS configuration** for proper production deployment
- **Custom Docker port support** for flexible deployment scenarios
- **Improved environment detection** (development/Docker/production)
- **Health checks** and service orchestration scripts

#### **Developer Experience**
- **Streamlined README** (73% reduction in size while preserving essential info)
- **Development scripts** for PostgreSQL service management
- **Modern tech stack badges** (React, Node.js, PostgreSQL)
- **Comprehensive API documentation** with examples

### 📋 **Migration Guide**

#### **🔴 IMPORTANT: PostgreSQL Migration Steps**

If you're upgrading from a previous version with SQLite data:

1. **Backup Your Data** (CRITICAL)
   ```bash
   # Export your existing data before upgrading
   cp your-sqlite-file.db backup-$(date +%Y%m%d).db
   ```

2. **Setup PostgreSQL** (Choose one option)
   
   **Option A: Using Docker (Recommended)**
   ```bash
   docker run --name cpp-postgres -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=cpp -p 5432:5432 -d postgres:13
   ```
   
   **Option B: Local Installation**
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   createdb cpp
   
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo -u postgres createdb cpp
   ```

3. **Configure Environment Variables**
   ```bash
   # Copy example environment file
   cp backend/.env.example backend/.env
   
   # Edit backend/.env with your settings:
   DATABASE_URL=postgresql://username:password@localhost:5432/cpp
   NODE_ENV=production
   ```

4. **Run the Migration**
   ```bash
   # The application will automatically migrate SQLite data on first PostgreSQL connection
   # Start the backend - it will detect SQLite data and migrate automatically
   cd backend && npm start
   ```

5. **Verify Migration**
   - Check that all your redemptions appear in the dashboard
   - Verify CPP calculations are correct
   - Test CSV import/export functionality

6. **Clean Up** (Optional)
   ```bash
   # After verifying migration was successful, you can remove SQLite files
   rm *.db
   ```

#### **Fresh Installation (No Migration)**
```bash
# Clone repository
git clone https://github.com/ayostepht/Cents-Per-Point.git
cd Cents-Per-Point

# Setup environment
cp backend/.env.example backend/.env
# Edit backend/.env with your PostgreSQL connection details

# Install dependencies
cd backend && npm install
cd ../frontend-vite && npm install

# Start services
cd ../backend && npm start
# In another terminal:
cd frontend-vite && npm run dev
```

### 🐛 **Bug Fixes**
- **Fixed Docker port detection** for custom deployment setups
- **Resolved CORS issues** in production environments
- **Fixed date formatting** consistency across charts
- **Improved error handling** for invalid CSV data
- **Fixed travel credit checkbox** functionality

### 🎨 **UI/UX Improvements**
- **Cleaner dashboard charts** with optimized legends and labels
- **Better CSV import workflow** with clear step indicators
- **Enhanced tooltips** with properly formatted data
- **Responsive design improvements** for mobile devices
- **Modern color scheme** with better contrast

### 📊 **Data & Analytics**
- **Smart data processing** for complex CSV formats
- **Improved CPP calculations** with better error handling
- **Enhanced date processing** supporting multiple formats
- **Better aggregation logic** for dashboard metrics

### 🔄 **API Enhancements**
- **New CSV endpoints**: `/api/csv/analyze`, `/api/csv/import`, `/api/csv/export`, `/api/csv/template`
- **Enhanced error responses** with detailed validation messages
- **Improved data validation** across all endpoints
- **Better memory management** for file uploads

---

### **Breaking Changes**
- **Database migration required** from SQLite to PostgreSQL
- **Environment variables** must be configured for PostgreSQL connection
- **Docker Compose** may need restart to apply new configurations

### **Known Issues**
- Large CSV files (>1000 rows) may take a few seconds to process
- Some complex CSV formats may require manual column mapping

### **Contributors**
- Major backend refactoring and PostgreSQL migration
- CSV import/export system implementation
- Dashboard analytics improvements
- Security vulnerability fixes
- Docker deployment enhancements

---

**Full Changelog**: https://github.com/ayostepht/Cents-Per-Point/compare/v0.1.0...v0.2.0 
## v0.3.3

### Security Updates
- "chore(deps): bump multer from 2.0.1 to 2.0.2 in /backend in the npm_and_yarn group across 1 directory" (#39)


## v0.3.4

### Security Updates
- "chore(deps): bump form-data from 4.0.2 to 4.0.4 in /frontend-vite in the npm_and_yarn group across 1 directory" (#40)

