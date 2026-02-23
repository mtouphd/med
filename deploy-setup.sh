#!/bin/bash
# =============================================================
# MedApp - DigitalOcean Droplet Setup Script
# Ubuntu 24.04 LTS | Node.js 20 | PostgreSQL 16 | Nginx | PM2
# =============================================================

set -e

echo "========================================="
echo "  MedApp Server Setup"
echo "========================================="

# --- System Update ---
echo "[1/7] Updating system..."
apt update && apt upgrade -y

# --- Install Node.js 20 LTS ---
echo "[2/7] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# --- Install PM2 ---
echo "[3/7] Installing PM2..."
npm install -g pm2

# --- Install PostgreSQL 16 ---
echo "[4/7] Installing PostgreSQL 16..."
apt install -y postgresql postgresql-contrib

# Start PostgreSQL (needed before creating user/db)
systemctl start postgresql
systemctl enable postgresql

# Generate a random password for the DB
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 20)
JWT_SECRET=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 40)

# Create database and user
sudo -u postgres psql <<EOF
CREATE USER medapp WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE medapp OWNER medapp;
GRANT ALL PRIVILEGES ON DATABASE medapp TO medapp;
\c medapp
GRANT ALL ON SCHEMA public TO medapp;
EOF

echo "Database created successfully."

# --- Install Nginx ---
echo "[5/7] Installing Nginx..."
apt install -y nginx

# --- Install Certbot (for SSL) ---
echo "[6/7] Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# --- Install Git ---
apt install -y git

# --- Create app user ---
echo "[7/7] Setting up application user..."
useradd -m -s /bin/bash medapp || true

# --- Create directories ---
mkdir -p /home/medapp/app

# --- Get Droplet IP (from system network interface) ---
DROPLET_IP=$(hostname -I | awk '{print $1}')

# --- Create backend .env ---
cat > /home/medapp/app/.env.backend <<EOF
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=medapp
DATABASE_PASSWORD=${DB_PASSWORD}
DATABASE_NAME=medapp
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
PORT=3001
EOF

# --- Create frontend .env ---
cat > /home/medapp/app/.env.frontend <<EOF
NEXT_PUBLIC_API_URL=http://${DROPLET_IP}:3001
EOF

# --- Create PM2 ecosystem file ---
cat > /home/medapp/app/ecosystem.config.js <<PMEOF
module.exports = {
  apps: [
    {
      name: 'medapp-backend',
      cwd: '/home/medapp/app/backend',
      script: 'dist/src/main.js',
      env: {
        NODE_ENV: 'production',
        DATABASE_HOST: 'localhost',
        DATABASE_PORT: '5432',
        DATABASE_USER: 'medapp',
        DATABASE_PASSWORD: '${DB_PASSWORD}',
        DATABASE_NAME: 'medapp',
        JWT_SECRET: '${JWT_SECRET}',
        JWT_EXPIRES_IN: '7d',
        PORT: '3001',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
    },
    {
      name: 'medapp-frontend',
      cwd: '/home/medapp/app/frontend',
      script: 'npm',
      args: 'start -- -p 3000',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'http://${DROPLET_IP}:3001',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
    },
  ],
};
PMEOF

# --- Configure Nginx (catch-all for IP access, no domain needed) ---
cat > /etc/nginx/sites-available/medapp <<'NGINXEOF'
server {
    listen 80 default_server;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/medapp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# --- Configure firewall ---
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 3001/tcp  # Backend direct access (for testing)
ufw allow 3000/tcp  # Frontend direct access (for testing)
ufw --force enable

# --- Start services ---
systemctl enable nginx
systemctl restart nginx

# --- Set PM2 to start on boot for medapp user ---
env PATH=$PATH:/usr/bin pm2 startup systemd -u medapp --hp /home/medapp

# --- Set ownership ---
chown -R medapp:medapp /home/medapp

# --- Save credentials to a file too ---
cat > /root/medapp-credentials.txt <<EOF
==========================================
  MedApp Server Credentials
==========================================

Droplet IP: ${DROPLET_IP}

Database:
  Host:     localhost
  Port:     5432
  User:     medapp
  Password: ${DB_PASSWORD}
  Database: medapp

JWT Secret: ${JWT_SECRET}

Env files:
  /home/medapp/app/.env.backend
  /home/medapp/app/.env.frontend
  /home/medapp/app/ecosystem.config.js
==========================================
EOF

chmod 600 /root/medapp-credentials.txt

echo ""
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "  Droplet IP: ${DROPLET_IP}"
echo ""
echo "  Database credentials:"
echo "    User:     medapp"
echo "    Password: ${DB_PASSWORD}"
echo "    Database: medapp"
echo ""
echo "  JWT Secret: ${JWT_SECRET}"
echo ""
echo "  Credentials also saved to: /root/medapp-credentials.txt"
echo ""
echo "  Next steps:"
echo "    1. su - medapp"
echo "    2. cd /home/medapp/app"
echo "    3. git clone YOUR_REPO_URL ."
echo "    4. cp .env.backend backend/.env"
echo "    5. cp .env.frontend frontend/.env.local"
echo "    6. cd backend && npm install && npm run build && cd .."
echo "    7. cd frontend && npm install && npm run build && cd .."
echo "    8. pm2 start ecosystem.config.js"
echo "    9. pm2 save"
echo ""
echo "  Then access your app at: http://${DROPLET_IP}"
echo ""
echo "  To add SSL later (with a domain):"
echo "    1. Edit /etc/nginx/sites-available/medapp"
echo "       (replace server_name _; with server_name yourdomain.com;)"
echo "    2. sudo certbot --nginx -d yourdomain.com"
echo "========================================="
