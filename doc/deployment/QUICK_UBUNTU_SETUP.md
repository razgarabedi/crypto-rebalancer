# 🚀 Quick Ubuntu Setup Guide

This guide will help you quickly deploy the Kraken Rebalancer on Ubuntu using PM2, Nginx, and Let's Encrypt SSL.

## 📋 Prerequisites

- Ubuntu 20.04+ server
- Root or sudo access
- Domain name pointing to your server
- Basic knowledge of Linux commands

## ⚡ Quick Setup (15 minutes)

### 1. Update System & Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Clone and Setup Application

```bash
# Clone repository
git clone <your-repo-url> kraken-rebalancer
cd kraken-rebalancer

# Install dependencies
npm install

# Install Prisma CLI
npm install -g prisma

# Generate Prisma client
npx prisma generate
```

### 3. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE kraken_rebalancer;
CREATE USER kraken_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE kraken_rebalancer TO kraken_user;
\q

# Run migrations
npx prisma migrate deploy
```

### 4. Environment Configuration

```bash
# Create production environment file
nano .env.production
```

Add the following content:

```env
# Database
DATABASE_URL="postgresql://kraken_user:your_secure_password@localhost:5432/kraken_rebalancer"

# Next.js
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Kraken API (optional)
KRAKEN_API_KEY=your_kraken_api_key
KRAKEN_API_SECRET=your_kraken_api_secret

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here
```

### 5. Build Application

```bash
# Build for production
npm run build

# Test the build
npm start
```

### 6. PM2 Configuration

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add the following content:

```javascript
module.exports = {
  apps: [{
    name: 'kraken-rebalancer',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/your/kraken-rebalancer',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Start with PM2:

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 7. Nginx Configuration

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/kraken-rebalancer
```

Add the following content:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/kraken-rebalancer /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 8. SSL with Let's Encrypt

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### 9. Firewall Configuration

```bash
# Allow necessary ports
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 🔧 Management Commands

### PM2 Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs kraken-rebalancer

# Restart application
pm2 restart kraken-rebalancer

# Stop application
pm2 stop kraken-rebalancer

# Monitor resources
pm2 monit
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### Database Commands

```bash
# Connect to database
sudo -u postgres psql -d kraken_rebalancer

# Run migrations
npx prisma migrate deploy

# Reset database (careful!)
npx prisma migrate reset
```

## 🔍 Troubleshooting

### Check Application Status

```bash
# PM2 status
pm2 status

# Nginx status
sudo systemctl status nginx

# Database status
sudo systemctl status postgresql
```

### View Logs

```bash
# Application logs
pm2 logs kraken-rebalancer

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx
```

### Common Issues

1. **Port 3000 not accessible**
   ```bash
   # Check if app is running
   pm2 status
   # Check port
   netstat -tlnp | grep :3000
   ```

2. **Database connection issues**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   # Test connection
   psql -h localhost -U kraken_user -d kraken_rebalancer
   ```

3. **SSL certificate issues**
   ```bash
   # Check certificate status
   sudo certbot certificates
   # Renew certificate
   sudo certbot renew
   ```

## 🔄 Updates and Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Build and restart
npm run build
pm2 restart kraken-rebalancer
```

### Backup Database

```bash
# Create backup
sudo -u postgres pg_dump kraken_rebalancer > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
sudo -u postgres psql kraken_rebalancer < backup_file.sql
```

### Monitor Resources

```bash
# System resources
htop

# PM2 monitoring
pm2 monit

# Disk usage
df -h

# Memory usage
free -h
```

## 🛡️ Security Checklist

- [ ] Change default database password
- [ ] Use strong JWT secret
- [ ] Configure firewall (UFW)
- [ ] Enable automatic security updates
- [ ] Regular database backups
- [ ] Monitor application logs
- [ ] SSL certificate auto-renewal

## 📊 Performance Optimization

### PM2 Cluster Mode

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'kraken-rebalancer',
    script: 'npm',
    args: 'start',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster'
  }]
};
```

### Nginx Optimization

```nginx
# Add to server block
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🎯 Quick Commands Reference

```bash
# Start everything
pm2 start ecosystem.config.js --env production
sudo systemctl start nginx

# Stop everything
pm2 stop all
sudo systemctl stop nginx

# Restart everything
pm2 restart all
sudo systemctl restart nginx

# View status
pm2 status
sudo systemctl status nginx
```

---

**Need help?** Check the main [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

**Security Note:** Always use strong passwords and keep your system updated!
