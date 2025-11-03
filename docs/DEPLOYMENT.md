# Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Application Deployment](#application-deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Scaling Strategy](#scaling-strategy)
7. [Security Checklist](#security-checklist)

---

## Prerequisites

### Required Software
- Node.js 18+ LTS
- PostgreSQL 14+
- PM2 or similar process manager
- Nginx (recommended for reverse proxy)
- SSL Certificate (Let's Encrypt recommended)

### Required Accounts
- Google OAuth credentials
- Facebook OAuth credentials
- Email service (Gmail SMTP or AWS SES)
- Sentry account (for error tracking)
- Cloud provider account (AWS, GCP, Azure)

---

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/Yummy.git
cd Yummy
```

### 2. Install Dependencies
```bash
npm ci --production
```

### 3. Create Environment File
Copy `.env.example` to `.env` and configure all variables:

```bash
cp .env.example .env
nano .env
```

**Critical Variables:**
- `JWT_SECRET`: Generate strong secret: `openssl rand -base64 32`
- `PGPASSWORD`: Strong database password
- `NODE_ENV=production`
- `FRONT_END_URL`: Your production frontend URL

### 4. Validate Environment
```bash
node -e "require('./config/envValidator').validateEnv()"
```

---

## Database Configuration

### 1. Create Production Database
```sql
CREATE DATABASE yummy_production;
CREATE USER yummy_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE yummy_production TO yummy_user;
```

### 2. Run Migrations
```bash
# If using migrations (recommended)
npm run migrate:production

# Or manually run SQL scripts
psql -U yummy_user -d yummy_production < migrations/schema.sql
```

### 3. Configure SSL
Update `config/db.config.js` to use proper SSL:
```javascript
ssl: {
  rejectUnauthorized: true,
  ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(),
}
```

### 4. Create Indexes
```sql
-- Add performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_restaurant_id ON reservations(restaurant_id);
CREATE INDEX idx_reservations_date ON reservations(date);
```

---

## Application Deployment

### Option 1: PM2 (Recommended for Single Server)

#### 1. Install PM2
```bash
npm install -g pm2
```

#### 2. Create PM2 Ecosystem File
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'yummy-api',
    script: './server.js',
    instances: 2, // Use CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M',
  }],
};
```

#### 3. Start Application
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. Monitor
```bash
pm2 status
pm2 logs yummy-api
pm2 monit
```

### Option 2: Docker

#### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5000
ENV envPORT=5000
CMD ["node", "server.js"]
```

#### 2. Build and Run
```bash
docker build -t yummy-api .
docker run -d \
  --name yummy-api \
  -p 5000:5000 \
  --env-file .env \
  --restart unless-stopped \
  yummy-api
```

### Option 3: Kubernetes

See `k8s/` directory for manifests (create if needed).

---

## Reverse Proxy Configuration (Nginx)

### 1. Install Nginx
```bash
sudo apt-get install nginx
```

### 2. Create Configuration
`/etc/nginx/sites-available/yummy-api`:
```nginx
upstream yummy_backend {
    least_conn;
    server localhost:5000;
    server localhost:5001; # If using multiple instances
}

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://yummy_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /healthz {
        proxy_pass http://yummy_backend;
        access_log off;
    }
}
```

### 3. Enable and Test
```bash
sudo ln -s /etc/nginx/sites-available/yummy-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Monitoring & Maintenance

### 1. Application Monitoring
- **PM2**: `pm2 monit`
- **Sentry**: Configured in `utils/sentry.js`
- **Logs**: Check `logs/` directory
- **Health Check**: `curl https://api.yourdomain.com/healthz`

### 2. Database Monitoring
```bash
# Connection pool status
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Slow queries
psql -c "SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;"
```

### 3. Log Rotation
Logs are automatically rotated by Winston (30 days retention).

### 4. Backup Strategy
```bash
# Daily database backup
pg_dump -U yummy_user yummy_production | gzip > backup_$(date +%Y%m%d).sql.gz

# Automated backup script (cron)
0 2 * * * /path/to/backup-script.sh
```

---

## Scaling Strategy

### Horizontal Scaling
1. **Load Balancer**: Use Nginx or cloud LB
2. **Multiple Instances**: Run multiple Node.js instances
3. **Database Replication**: Set up read replicas
4. **Caching**: Implement Redis for frequently accessed data

### Vertical Scaling
1. **Database**: Increase PostgreSQL resources
2. **Application**: Increase server resources
3. **Connection Pool**: Tune pool settings in `config/db.config.js`

### Recommended Configuration
- **Small (< 1K users)**: 1 server, 2 Node instances
- **Medium (1K-10K users)**: 2 servers, 4 Node instances total
- **Large (> 10K users)**: Auto-scaling group, database cluster

---

## Security Checklist

- [ ] All environment variables set and validated
- [ ] Strong JWT secret (32+ characters)
- [ ] Database SSL enabled
- [ ] HTTPS/SSL certificate configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers configured (Helmet)
- [ ] Regular security updates
- [ ] Database backups automated
- [ ] Monitoring and alerting set up
- [ ] Access logs reviewed regularly
- [ ] Dependency vulnerabilities checked (`npm audit`)

---

## Troubleshooting

### Application Won't Start
1. Check environment variables: `node -e "require('./config/envValidator').validateEnv()"`
2. Check database connection: `psql -U $PGUSER -d $PGDATABASE`
3. Check logs: `tail -f logs/combined-*.log`

### High Memory Usage
1. Reduce PM2 instances
2. Check for memory leaks
3. Review database query performance

### Database Connection Issues
1. Verify connection pool settings
2. Check PostgreSQL logs
3. Verify SSL configuration

---

## Support

For issues or questions:
- GitHub Issues: [Your Repo]
- Documentation: [Your Docs URL]
- Email: support@yourdomain.com

