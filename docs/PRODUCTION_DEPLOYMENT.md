# DineFlow Production Deployment Guide

## Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Domain name managed via Route53, Cloudflare, etc.
- Access to deployment hosting provider (AWS, Vercel, Render)
- Valid SMTP credentials

## Step 1: MongoDB Atlas Configuration
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a dedicated Database user for DineFlow (Do not use admin accounts).
3. Whitelist your deployment hosting provider's IP range under **Network Access** (or `0.0.0.0/0` if relying on credentials).
4. Retrieve the MongoDB URI. It looks like `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`.

## Step 2: Environment Variables
Create your production `.env` file (usually on the hosting provider's dashboard) matching `.env.example`. 

**Critical Variables required:**
```env
APP_ENV=production
NODE_ENV=production

# URLs
APP_URL=https://app.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
BACKEND_URL=https://api.yourdomain.com
API_URL=https://api.yourdomain.com/api
CORS_ORIGINS=https://app.yourdomain.com

# Database
MONGODB_URI=mongodb+srv://<dbuser>:<dbpassword>@<cluster>.mongodb.net/dineflow_prod

# Secrets (Minimum 32 Characters)
AUTH_SECRET=...
SESSION_SECRET=...
JWT_SECRET=...

# Cookies
COOKIE_DOMAIN=.yourdomain.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
```

## Step 3: Deployment
1. Build the application `npm run build`.
2. Start the application `npm run start`.
3. Ensure `/api/health` returns `{ "status": "ok" }`.

## Step 4: DNS Configuration
Add a CNAME or A Record pointing `app` and `api` to your hosting provider's ingress servers.

## Step 5: HTTPS/SSL
Ensure your hosting provider provisions TLS certificates (Let's Encrypt, AWS ACM, Cloudflare Edge Certificates). Strict HTTPS is required for all cookies (`COOKIE_SECURE=true`).
