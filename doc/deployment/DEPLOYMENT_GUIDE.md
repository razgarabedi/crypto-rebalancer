# Complete Deployment Guide - Kraken Rebalancer on Ubuntu with Nginx

This guide provides step-by-step instructions for deploying the Kraken Rebalancer application on an Ubuntu server using Nginx as a reverse proxy.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Install Node.js and npm](#install-nodejs-and-npm)
4. [Install and Configure PostgreSQL](#install-and-configure-postgresql)
5. [Clone and Setup Application](#clone-and-setup-application)
6. [Environment Configuration](#environment-configuration)
7. [Build the Application](#build-the-application)
8. [Setup PM2 Process Manager](#setup-pm2-process-manager)
9. [Install and Configure Nginx](#install-and-configure-nginx)
10. [SSL Configuration with Let's Encrypt](#ssl-configuration-with-lets-encrypt)
11. [Firewall Configuration](#firewall-configuration)
12. [Maintenance and Monitoring](#maintenance-and-monitoring)
13. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- An Ubuntu 20.04 or 22.04 server (VPS or dedicated server)
- Root or sudo access to the server
- A domain name pointing to your server's IP address (for SSL)
- At least 2GB RAM and 20GB disk space
- SSH access to the server

---

## Server Setup

### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Essential Tools

```bash
sudo apt install -y curl wget git build-essential
```

### 3. Create Application User (Optional but Recommended)

```bash
sudo adduser krakenapp --disabled-password
sudo usermod -aG sudo krakenapp
```

---

## Install Node.js and npm

### Install Node.js 20.x (LTS)

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

---

## Install and Configure PostgreSQL

### 1. Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
```

### 2. Start and Enable PostgreSQL

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Create Database and User

```bash
# Switch to postgres user
sudo -i -u postgres

# Access PostgreSQL prompt
psql

# Create database
CREATE DATABASE kraken_rebalancer;

# Create user with password
CREATE USER krakenuser WITH PASSWORD 'your_secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE kraken_rebalancer TO krakenuser;

# Grant schema privileges (PostgreSQL 15+)
\c kraken_rebalancer
GRANT ALL ON SCHEMA public TO krakenuser;

# Exit PostgreSQL
\q

# Exit postgres user
exit
```

### 4. Configure PostgreSQL for Local Access

Edit the PostgreSQL configuration:

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Ensure the following line exists (adjust version number if different):

```
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

---

## Clone and Setup Application

### 1. Clone Repository

```bash
# If using application user
sudo su - krakenapp

# Clone the repository
git clone https://github.com/yourusername/kraken-rebalancer.git
cd kraken-rebalancer
```

Or upload your application files using SCP/SFTP to `/home/krakenapp/kraken-rebalancer`

### 2. Install Dependencies

```bash
npm install
```

---

## Environment Configuration

### 1. Create .env File

```bash
nano .env
```

Add the following configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://krakenuser:your_secure_password_here@localhost:5432/kraken_rebalancer?schema=public"

# Application Configuration
NODE_ENV=production
PORT=3000

# JWT Secret (generate a strong random string)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# Kraken API Credentials
KRAKEN_API_KEY=your_kraken_api_key_here
KRAKEN_API_SECRET=your_kraken_api_secret_here

# Optional: Logging
LOG_LEVEL=info
```

### 2. Generate Strong JWT Secret

```bash
# Generate a secure random string
openssl rand -base64 32
```

Copy the output and use it as your `JWT_SECRET` in the .env file.

### 3. Set File Permissions

```bash
chmod 600 .env
```

---

## Build the Application

### 1. Run Prisma Migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

### 2. Build Next.js Application

```bash
npm run build
```

This will create an optimized production build in the `.next` directory.

### 3. Test the Application

```bash
# Start the application
npm start

# Test if it's running
curl http://localhost:3000
```

If successful, stop the application (Ctrl+C) and proceed to setup PM2.

---

## Setup PM2 Process Manager

PM2 keeps your application running and automatically restarts it if it crashes.

### 1. Install PM2 Globally

```bash
sudo npm install -g pm2
```

### 2. Create PM2 Ecosystem File

```bash
nano ecosystem.config.js
```

Add the following configuration:

```javascript
module.exports = {
  apps: [{
    name: 'kraken-rebalancer',
    script: 'npm',
    args: 'start',
    cwd: '/home/krakenapp/kraken-rebalancer',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
  }]
};
```

### 3. Create Logs Directory

```bash
mkdir -p logs
```

### 4. Start Application with PM2

```bash
pm2 start ecosystem.config.js
```

### 5. Setup PM2 Startup Script

```bash
# Generate startup script
pm2 startup systemd

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u krakenapp --hp /home/krakenapp
# Run that command

# Save PM2 process list
pm2 save
```

### 6. Useful PM2 Commands

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

---

## Install and Configure Nginx

### 1. Install Nginx

```bash
sudo apt install -y nginx
```

### 2. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/kraken-rebalancer
```

Add the following configuration:

```nginx
# Upstream configuration
upstream kraken_app {
    server localhost:3000;
    keepalive 64;
}

# HTTP server - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/kraken-rebalancer.access.log;
    error_log /var/log/nginx/kraken-rebalancer.error.log;

    # Client body size
    client_max_body_size 10M;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Proxy settings
    location / {
        proxy_pass http://kraken_app;
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

    # Static files caching
    location /_next/static {
        proxy_pass http://kraken_app;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Favicon
    location = /favicon.ico {
        proxy_pass http://kraken_app;
        access_log off;
        log_not_found off;
    }
}
```

**Important:** Replace `yourdomain.com` with your actual domain name.

### 3. Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/kraken-rebalancer /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If successful, reload Nginx
sudo systemctl reload nginx
```

### 4. Enable and Start Nginx

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## SSL Configuration with Let's Encrypt

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email address
- Agree to the terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 3. Verify Auto-Renewal

Certbot automatically sets up auto-renewal. Test it:

```bash
sudo certbot renew --dry-run
```

### 4. Check Certificate Status

```bash
sudo certbot certificates
```

---

## Firewall Configuration

### 1. Install UFW (if not installed)

```bash
sudo apt install -y ufw
```

### 2. Configure Firewall Rules

```bash
# Allow SSH (important - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Maintenance and Monitoring

### Regular Maintenance Tasks

#### 1. Update Application

```bash
cd /home/krakenapp/kraken-rebalancer

# Pull latest changes
git pull

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Rebuild application
npm run build

# Restart with PM2
pm2 restart kraken-rebalancer
```

#### 2. Database Backups

Create a backup script:

```bash
nano ~/backup-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/krakenapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/kraken_rebalancer_$DATE.sql"

mkdir -p $BACKUP_DIR

# Create backup
PGPASSWORD="your_secure_password_here" pg_dump -h localhost -U krakenuser kraken_rebalancer > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

Make it executable:

```bash
chmod +x ~/backup-db.sh
```

Setup cron job for daily backups:

```bash
crontab -e
```

Add:

```
# Daily database backup at 2 AM
0 2 * * * /home/krakenapp/backup-db.sh >> /home/krakenapp/logs/backup.log 2>&1
```

#### 3. Log Rotation

Create logrotate configuration:

```bash
sudo nano /etc/logrotate.d/kraken-rebalancer
```

Add:

```
/home/krakenapp/kraken-rebalancer/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 krakenapp krakenapp
    sharedscripts
}
```

#### 4. Monitor Application

```bash
# Check PM2 status
pm2 status

# View real-time logs
pm2 logs kraken-rebalancer --lines 100

# Check memory usage
pm2 monit

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/kraken-rebalancer.error.log
```

### Setup Monitoring Alerts (Optional)

Install and configure monitoring tools:

```bash
# Install Prometheus Node Exporter
sudo apt install -y prometheus-node-exporter

# Or use PM2 Plus for monitoring
pm2 link <secret_key> <public_key>
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start

```bash
# Check PM2 logs
pm2 logs kraken-rebalancer

# Check application errors
cat /home/krakenapp/kraken-rebalancer/logs/err.log

# Verify environment variables
cat .env

# Test database connection
npx prisma db pull
```

#### 2. Nginx 502 Bad Gateway

```bash
# Check if application is running
pm2 status

# Check if port 3000 is listening
sudo netstat -tulpn | grep 3000

# Check Nginx error logs
sudo tail -f /var/log/nginx/kraken-rebalancer.error.log

# Restart services
pm2 restart kraken-rebalancer
sudo systemctl restart nginx
```

#### 3. Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h localhost -U krakenuser -d kraken_rebalancer

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### 4. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test Nginx configuration
sudo nginx -t
```

#### 5. Permission Issues

```bash
# Fix application directory permissions
sudo chown -R krakenapp:krakenapp /home/krakenapp/kraken-rebalancer

# Fix log file permissions
chmod -R 755 /home/krakenapp/kraken-rebalancer/logs
```

#### 6. Out of Memory

```bash
# Check memory usage
free -h

# Restart application
pm2 restart kraken-rebalancer

# Consider upgrading server or optimizing application
```

### Health Check Endpoints

Test these URLs to verify deployment:

```bash
# Application health
curl https://yourdomain.com/

# API health (if you create a health endpoint)
curl https://yourdomain.com/api/health

# Check response time
time curl -I https://yourdomain.com/
```

---

## Security Best Practices

1. **Keep System Updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Setup Fail2ban** (protects against brute force attacks)
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

3. **Disable Root SSH Login**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   sudo systemctl restart sshd
   ```

4. **Use SSH Keys Instead of Passwords**

5. **Regular Backups** - Keep database and application backups

6. **Monitor Logs** - Regularly check logs for suspicious activity

7. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

---

## Performance Optimization

### 1. Enable Next.js Image Optimization

Ensure your `next.config.mjs` has proper image configuration.

### 2. Database Connection Pooling

Already configured in Prisma. Verify in your schema.

### 3. Enable HTTP/2

Already configured in Nginx configuration above.

### 4. CDN Integration (Optional)

Consider using Cloudflare or similar CDN for static assets.

---

## Conclusion

Your Kraken Rebalancer application should now be fully deployed and running on Ubuntu with Nginx!

### Quick Reference Commands

```bash
# Application
pm2 restart kraken-rebalancer
pm2 logs kraken-rebalancer

# Web Server
sudo systemctl restart nginx
sudo nginx -t

# Database
sudo systemctl restart postgresql
psql -h localhost -U krakenuser -d kraken_rebalancer

# SSL
sudo certbot renew

# Logs
pm2 logs
sudo tail -f /var/log/nginx/kraken-rebalancer.error.log

# Backups
~/backup-db.sh
```

### Support Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

**Last Updated:** October 2025

For issues or questions, please refer to the project repository or contact your system administrator.

