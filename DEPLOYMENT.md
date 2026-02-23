# MedApp Deployment Guide - DigitalOcean Droplet

## Prerequisites
- DigitalOcean Droplet: Ubuntu 24.04 LTS, 2 GB RAM / 1 CPU ($12/mo)
- SSH access to the Droplet
- A domain name (optional, but recommended for SSL)

## Step 1: Connect to your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

## Step 2: Run the setup script

Upload and run the setup script:

```bash
# From your local machine, upload the script
scp deploy-setup.sh root@YOUR_DROPLET_IP:/root/

# Connect and run
ssh root@YOUR_DROPLET_IP
chmod +x /root/deploy-setup.sh
bash /root/deploy-setup.sh
```

## Step 3: Deploy the application

```bash
# From your local machine, push your code to a git repo, then on the server:
su - medapp
cd /home/medapp
git clone YOUR_REPO_URL app
cd app

# Install dependencies
cd backend && npm install && npm run build && cd ..
cd frontend && npm install && npm run build && cd ..

# Start with PM2
cd /home/medapp/app
pm2 start ecosystem.config.js
pm2 save
```

## Step 4: Configure Nginx (if using a domain)

Replace `YOUR_DOMAIN` in `/etc/nginx/sites-available/medapp` with your actual domain, then:

```bash
sudo certbot --nginx -d YOUR_DOMAIN
```

## Environment Variables

Edit `/home/medapp/app/backend/.env`:
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=medapp
DATABASE_PASSWORD=<generated_password>
DATABASE_NAME=medapp
JWT_SECRET=<generated_secret>
JWT_EXPIRES_IN=7d
PORT=3001
```

Edit `/home/medapp/app/frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://YOUR_DROPLET_IP:3001
```
Or with domain:
```
NEXT_PUBLIC_API_URL=https://YOUR_DOMAIN/api
```

## Useful Commands

```bash
# View logs
pm2 logs

# Restart apps
pm2 restart all

# Check status
pm2 status

# Update deployment
cd /home/medapp/app
git pull
cd backend && npm install && npm run build && cd ..
cd frontend && npm install && npm run build && cd ..
pm2 restart all
```
