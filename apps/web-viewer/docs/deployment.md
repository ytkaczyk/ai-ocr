# Deployment Guide

This guide covers deploying the OCR Translation Comparison Viewer to various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Build Process](#build-process)
- [Deployment Options](#deployment-options)
  - [Vercel](#vercel-recommended)
  - [Docker](#docker)
  - [Traditional Server](#traditional-server-nodejs)
  - [Cloud Platforms](#cloud-platforms)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- Node.js 24.x or later installed
- Access to deployment target (server, cloud platform, container registry)
- Data folder with document sets prepared
- Environment variables configured
- SSL certificate (for HTTPS in production)

## Environment Configuration

### Required Environment Variables

Create a `.env.production` file with:

```bash
# Data Folder (REQUIRED)
DATA_FOLDER_PATH=/path/to/production/data

# PDF Configuration
MAX_PDF_SIZE_MB=50

# Memory Configuration
MEMORY_LIMIT_MB=500

# Next.js Configuration
NODE_ENV=production
NEXT_PUBLIC_PDF_WORKER_SRC=/pdf.worker.mjs
```

### Optional Environment Variables

```bash
# Logging
LOG_LEVEL=info
DEBUG=false

# Performance
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Security
ALLOWED_ORIGINS=https://yourdomain.com

# Feature Flags
ENABLE_3_PANE_MODE=true
```

### Security Considerations

- **Never commit** `.env` files to version control
- Use environment-specific files: `.env.development`, `.env.production`
- Store secrets in secure secret management systems (AWS Secrets Manager, Azure Key Vault, etc.)
- Rotate secrets regularly
- Use least-privilege access for file system permissions

## Build Process

### 1. Install Dependencies

```bash
cd apps/web-viewer
npm ci --production=false
```

### 2. Run Tests (Optional but Recommended)

```bash
npm run test
npm run test:e2e
```

### 3. Build Production Bundle

```bash
npm run build
```

This creates an optimized production build in `.next/` directory.

**Build Output:**
```
Route (app)                              Size     First Load JS
┌ ○ /                                    15.2 kB        116 kB
├ ○ /api/documents                       0 B                0 B
├ ○ /api/documents/[documentId]          0 B                0 B
└ ...

○  (Static)  prerendered as static content
λ  (Server)  server-rendered on demand
```

### 4. Verify Build

```bash
npm run start
```

Access `http://localhost:3000` to verify the production build works.

## Deployment Options

### Vercel (Recommended)

**Best for**: Quick deployment with zero configuration, automatic CI/CD

#### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd apps/web-viewer
vercel --prod
```

3. Configure environment variables in Vercel dashboard:
   - Navigate to project settings
   - Add `DATA_FOLDER_PATH`, `MAX_PDF_SIZE_MB`, etc.

4. Update data folder:
   - Mount persistent volume or use Vercel Storage
   - Update `DATA_FOLDER_PATH` to volume path

#### Option 2: Deploy via GitHub Integration

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables
4. Enable automatic deployments

**Pros:**
- Zero-config deployment
- Automatic HTTPS
- CDN edge caching
- Automatic scaling

**Cons:**
- Limited file system access (requires external storage)
- Cold start latency for infrequent traffic

---

### Docker

**Best for**: Containerized deployments, Kubernetes, on-premise servers

#### Dockerfile

Create `Dockerfile` in `apps/web-viewer/`:

```dockerfile
# Base stage
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production stage
FROM base AS runner
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy build artifacts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Mount data folder
VOLUME ["/app/data"]

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  web-viewer:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATA_FOLDER_PATH=/app/data
      - MAX_PDF_SIZE_MB=50
      - MEMORY_LIMIT_MB=500
    volumes:
      - ./data:/app/data:ro  # Mount data folder as read-only
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### Build and Run

```bash
# Build image
docker build -t ocr-viewer:latest .

# Run container
docker run -p 3000:3000 \
  -e DATA_FOLDER_PATH=/app/data \
  -v $(pwd)/data:/app/data:ro \
  ocr-viewer:latest

# Or use docker-compose
docker-compose up -d
```

**Pros:**
- Portable across environments
- Easy scaling with orchestration (Kubernetes, Docker Swarm)
- Isolated dependencies

**Cons:**
- Requires Docker knowledge
- Additional resource overhead

---

### Traditional Server (Node.js)

**Best for**: On-premise deployments, existing Node.js infrastructure

#### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 24.x
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### 2. Copy Files

```bash
# Copy built application
scp -r apps/web-viewer user@server:/var/www/ocr-viewer

# Copy data folder
scp -r data user@server:/var/data/ocr-documents
```

#### 3. Configure Environment

```bash
cd /var/www/ocr-viewer
cat > .env.production <<EOF
DATA_FOLDER_PATH=/var/data/ocr-documents
MAX_PDF_SIZE_MB=50
MEMORY_LIMIT_MB=500
NODE_ENV=production
EOF
```

#### 4. Start Application with PM2

```bash
# Start app
pm2 start npm --name "ocr-viewer" -- start

# Save PM2 configuration
pm2 save

# Enable PM2 on system startup
pm2 startup
```

#### 5. Configure Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name ocr-viewer.example.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ocr-viewer.example.com;

    ssl_certificate /etc/letsencrypt/live/ocr-viewer.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ocr-viewer.example.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

**Pros:**
- Full control over server
- No vendor lock-in
- Direct file system access

**Cons:**
- Manual scaling
- Requires server management
- Manual SSL certificate renewal

---

### Cloud Platforms

#### AWS (Elastic Beanstalk)

1. Install AWS CLI and EB CLI
2. Initialize Elastic Beanstalk:
```bash
eb init -p node.js-24 ocr-viewer
```

3. Create environment:
```bash
eb create production --scale 2
```

4. Configure environment variables:
```bash
eb setenv DATA_FOLDER_PATH=/data MAX_PDF_SIZE_MB=50
```

5. Mount EFS for data folder:
```bash
eb mount efs-id:/data
```

#### Azure (App Service)

1. Create App Service:
```bash
az webapp create --resource-group ocr-rg --plan ocr-plan --name ocr-viewer --runtime "NODE:20-lts"
```

2. Configure app settings:
```bash
az webapp config appsettings set --resource-group ocr-rg --name ocr-viewer --settings DATA_FOLDER_PATH=/data
```

3. Deploy code:
```bash
az webapp deployment source config-zip --resource-group ocr-rg --name ocr-viewer --src app.zip
```

#### Google Cloud (Cloud Run)

1. Build container:
```bash
gcloud builds submit --tag gcr.io/project-id/ocr-viewer
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy ocr-viewer \
  --image gcr.io/project-id/ocr-viewer \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATA_FOLDER_PATH=/data
```

3. Mount Cloud Storage bucket:
```bash
gcloud run services update ocr-viewer --add-volume-mount=name=data,mount-path=/data
```

---

## Post-Deployment

### 1. Health Check

Verify application is running:

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-05T10:30:00Z",
  "version": "1.0.0"
}
```

### 2. Smoke Tests

Test critical paths:

```bash
# List documents
curl https://your-domain.com/api/documents

# Load specific document
curl https://your-domain.com/api/documents/contract-2024

# Get page content
curl https://your-domain.com/api/documents/contract-2024/pages/1/markdown?languageCode=en-US
```

### 3. Performance Monitoring

- **Lighthouse CI**: Run performance audits
- **Application Performance Monitoring**: New Relic, Datadog, etc.
- **Log Aggregation**: CloudWatch, Stackdriver, Azure Monitor

### 4. Security Hardening

- [ ] Enable HTTPS (Let's Encrypt, AWS Certificate Manager)
- [ ] Configure CSP headers
- [ ] Set up rate limiting
- [ ] Enable CORS (if needed)
- [ ] Restrict file system permissions
- [ ] Regular dependency updates (`npm audit`, Dependabot)
- [ ] Set up Web Application Firewall (WAF)

## Troubleshooting

### Build Failures

**Issue**: `Module not found` errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm ci
npm run build
```

**Issue**: TypeScript errors
```bash
# Check type errors
npm run type-check
```

### Runtime Errors

**Issue**: Data folder not found
- Verify `DATA_FOLDER_PATH` environment variable
- Check file system permissions (read access required)
- Ensure data folder mounted correctly (Docker/cloud)

**Issue**: PDF rendering fails
- Verify PDF.js worker file exists: `public/pdf.worker.mjs`
- Check browser console for errors
- Test with smaller PDF files

**Issue**: High memory usage
- Reduce `MEMORY_LIMIT_MB` to trigger cleanup earlier
- Scale horizontally (add more instances)
- Optimize document size (compress PDFs)

### Performance Issues

**Issue**: Slow page loads
- Enable CDN caching
- Implement service worker for offline support
- Reduce PDF quality in settings
- Limit document page count

**Issue**: High CPU usage
- Scale horizontally
- Implement request queuing
- Cache frequently accessed documents

## Monitoring

### Metrics to Track

- **Response Time**: API endpoint latency (p50, p95, p99)
- **Error Rate**: 4xx/5xx responses
- **Memory Usage**: Heap size, memory pressure events
- **CPU Usage**: Average CPU utilization
- **Disk I/O**: Read throughput for data folder
- **Cache Hit Rate**: Next.js cache effectiveness

### Alerting

Set up alerts for:
- Response time > 1s (p95)
- Error rate > 1%
- Memory usage > 90%
- CPU usage > 80% (sustained 5+ minutes)
- Disk space < 10%

### Log Aggregation

Example log query (CloudWatch):
```
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by bin(5m)
```

## Rollback Procedure

If deployment fails:

1. **Vercel**: Redeploy previous commit via dashboard
2. **Docker**: Revert to previous image tag
3. **PM2**: `pm2 reload ocr-viewer --update-env`
4. **Cloud platforms**: Revert deployment via CLI/dashboard

## Support

For deployment issues:
1. Check application logs
2. Review [Troubleshooting](#troubleshooting) section
3. Consult platform-specific documentation
4. Create GitHub issue with deployment details

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
