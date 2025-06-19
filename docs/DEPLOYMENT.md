# Deployment Guide

## 🚀 Quick Start

### Fresh Installation

```bash
# Step 1: Create environment file
echo "DB_PASSWORD=your-secure-password" > .env

# Step 2: Download and start
curl -o docker-compose.yml https://raw.githubusercontent.com/stephtanner1/Cost%20Per%20Point/main/docker-compose.yml
docker-compose up -d
```

### Migration from SQLite

If you have existing SQLite data in a Docker volume:

```bash
# Step 1: Create environment file with migration enabled
cat > .env << EOF
DB_PASSWORD=your-secure-password
ENABLE_SQLITE_MIGRATION=true
EOF

# Step 2: Download compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/stephtanner1/Cost%20Per%20Point/main/docker-compose.yml

# Step 3: Edit to uncomment SQLite volume lines:
# In backend service: uncomment volumes section
# In volumes section: uncomment backend_data

# Step 4: Start with automatic migration
docker-compose up -d
```

## 🔧 Configuration

### For Migration Users

Simply uncomment these lines in `docker-compose.yml`:

**In the backend service:**
```yaml
volumes:
  - backend_data:/app/data  # Replace 'backend_data' with your volume name
```

**In the volumes section:**
```yaml
volumes:
  postgres_data:
  backend_data:  # Replace 'backend_data' with your volume name
```

### Environment Variables

**Required:** Create a `.env` file with your database password:

```bash
# Required: Database password
DB_PASSWORD=your-secure-password

# Optional: Enable SQLite migration
ENABLE_SQLITE_MIGRATION=true
```

## 🔄 Migration Process

### Automatic Detection

The application automatically:
1. **Detects** SQLite database if volume is mounted
2. **Migrates** data to PostgreSQL on first startup
3. **Creates** backup of original SQLite file
4. **Prevents** re-migration with flag file

### Migration Status

Check status via health endpoint:

```bash
curl http://localhost:5000/health
```

Example responses:

```json
// Fresh installation
{
  "status": "OK",
  "database": "PostgreSQL",
  "migration": {
    "status": "no_sqlite_found",
    "message": "Started fresh with PostgreSQL"
  }
}

// Successful migration
{
  "status": "OK", 
  "database": "PostgreSQL",
  "migration": {
    "status": "completed",
    "migratedCount": 150,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## 📁 Simple File Structure

```
your-deployment/
├── docker-compose.yml    # Single compose file
└── .env                 # Optional configuration
```

## 🛠️ Usage Examples

### New Users (No Migration)

```bash
# Step 1: Set database password
echo "DB_PASSWORD=$(openssl rand -base64 32)" > .env

# Step 2: Download and run
curl -o docker-compose.yml https://raw.githubusercontent.com/stephtanner1/Cost%20Per%20Point/main/docker-compose.yml
docker-compose up -d
```

### Existing Users (With SQLite Data)

```bash
# Step 1: Create environment file with migration enabled
cat > .env << EOF
DB_PASSWORD=your-secure-password
ENABLE_SQLITE_MIGRATION=true
EOF

# Step 2: Download compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/stephtanner1/Cost%20Per%20Point/main/docker-compose.yml

# Step 3: Edit to uncomment SQLite volume lines
# (uncomment volumes lines in backend service and volumes section)

# Step 4: Start with automatic migration
docker-compose up -d

# Step 5: Verify migration
curl http://localhost:5000/health
```

### Production Deployment

```bash
# Set secure password (optional)
echo "DB_PASSWORD=$(openssl rand -base64 32)" > .env

# Start application
docker-compose up -d
```

## 🔄 Updates

### Regular Updates

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

### From SQLite Version

```bash
# Download new compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/stephtanner1/Cost%20Per%20Point/main/docker-compose.yml

# Uncomment volume lines for your SQLite data
# (edit docker-compose.yml)

# Start with automatic migration
docker-compose up -d
```

## 📊 Monitoring

### Health Checks

```bash
# Application health
curl http://localhost:5000/health

# Service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Backup

```bash
# PostgreSQL backup
docker-compose exec postgres pg_dump -U postgres cpp_database > backup.sql

# Volume backup
docker run --rm -v costperpoint_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
```

## 🔒 Security

### Production Checklist

- [ ] Change default password: `DB_PASSWORD=your-secure-password` in `.env`
- [ ] Remove external PostgreSQL port (comment out `ports:` in postgres service)
- [ ] Use HTTPS reverse proxy (nginx, traefik, etc.)
- [ ] Regular backups
- [ ] Monitor logs

## 📝 Notes

- **Single file**: Only `docker-compose.yml` needed
- **Automatic migration**: Detects and migrates SQLite data when volume is mounted
- **Simple editing**: Just uncomment lines for migration
- **Clean defaults**: Works out of the box for new users
- **No environment variables**: Migration controlled by commenting/uncommenting lines 