
# Deployment & Production Guide

## Table of Contents
- [Environments](#environments)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Platform Deployment](#cloud-platform-deployment)
  - [Railway](#railway-deployment)
  - [Render](#render-deployment)
  - [Heroku](#heroku-deployment)
- [Health Check & Verification](#health-check--verification)
- [Production Hardening](#production-hardening)

---

## Environments
- **Local:** Node 20+, `.env` file for configuration.  
- **Containerized:** Dockerfile + docker-compose for local orchestration.  
- **Cloud:** Railway, Render, or Heroku for free-tier hosting.
- **CI:** Node LTS install, lint, unit tests, artifact.

---

## Environment Variables

### Required Variables
- `API_KEY` — API key required for REST and Socket.IO authentication (**REQUIRED in production**)
- `PORT` — HTTP port (default 8080, auto-set by most cloud providers)

### Optional Variables
- `NODE_ENV` — Environment mode (`development|production`)
- `LOG_LEVEL` — Logging level: `debug|info|warn|error` (default: `info`)
- `SESSION_MAX_TRAINEES` — Maximum trainees per session (default: `10`)
- `REQUIRE_API_KEY` — Enable API key enforcement (default: `true`)
- `REQUIRE_TICKET_ID` — Require ticket ID for mutations (default: `true`, set to `false` for demo)
- `AUDIT_LOG_ENABLED` — Enable audit logging (default: `true`)
- `CODEBASE_CONTEXT` — Audit log context label (default: `SIRE_backend`)
- `TICKET_HEADER` — Header name for ticket IDs (default: `x-ticket-id`)
- `API_KEY_HEADER` — Header name for API key (default: `x-api-key`)
- `REQUEST_ID_HEADER` — Header name for request ID (default: `x-request-id`)
- `SOCKET_API_KEY_HEADER` — Socket.IO handshake API key header (default: `x-api-key`)

---

## Local Development

### Steps
```bash
cd SIRE_backend/backend
npm install
npm run dev
```

### With Environment Variables
```bash
API_KEY=local-dev-key npm run dev
```

### Using .env File
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update variables in `.env`
3. Run the server:
   ```bash
   npm run dev
   ```

---

## Docker Deployment

### Build and Run
```bash
cd SIRE_backend/backend
docker compose up --build
```

### Production Docker Build
```bash
docker build -t sire-backend:latest .
docker run -p 8080:8080 \
  -e API_KEY=your-secure-key \
  -e LOG_LEVEL=info \
  sire-backend:latest
```

---

## Cloud Platform Deployment

### Railway Deployment

Railway is a modern deployment platform with excellent Node.js support and a generous free tier.

#### Quick Deploy
1. **Create Railway Account**: Visit [railway.app](https://railway.app)
2. **Connect GitHub**: Link your GitHub account
3. **New Project**: 
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `Anaxagorius/S.I.R.E.`
   - Set root directory to `SIRE_backend/backend`

#### Configuration
Railway will auto-detect the `railway.json` file and configure:
- Build command: `npm ci`
- Start command: `npm start`
- Health check: `/api/health`

#### Environment Variables
Set in Railway dashboard → Variables:
- `API_KEY` (Generate a secure random string)
- `REQUIRE_TICKET_ID=false` (for demo purposes)
- Other variables are optional (defaults apply)

#### Verification
```bash
curl https://your-app.railway.app/api/health \
  -H "x-api-key: YOUR_API_KEY"
```

Expected response:
```json
{
  "status": "ok",
  "timestampIso": "2026-02-10T17:00:00.000Z",
  "requestId": "..."
}
```

---

### Render Deployment

Render offers a robust free tier with automatic SSL and continuous deployment.

#### Quick Deploy
1. **Create Render Account**: Visit [render.com](https://render.com)
2. **New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `Anaxagorius/S.I.R.E.`

#### Manual Configuration
If not using `render.yaml`:
- **Name**: `sire-backend`
- **Runtime**: Node
- **Build Command**: `npm ci`
- **Start Command**: `npm start`
- **Root Directory**: `SIRE_backend/backend`

#### Environment Variables
Set in Render dashboard → Environment:
- `API_KEY` (Generate secret)
- `REQUIRE_TICKET_ID=false`
- `LOG_LEVEL=info`

#### Using render.yaml (Blueprint)
1. In Render dashboard, select "New" → "Blueprint"
2. Connect repository
3. Render will auto-detect `render.yaml` and configure everything

#### Verification
```bash
curl https://sire-backend.onrender.com/api/health \
  -H "x-api-key: YOUR_API_KEY"
```

---

### Heroku Deployment

Heroku is a well-established platform with extensive documentation and tooling.

#### Prerequisites
- Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
- Create a [Heroku account](https://signup.heroku.com/)

#### Method 1: CLI Deployment
```bash
# Login to Heroku
heroku login

# Navigate to backend directory
cd SIRE_backend/backend

# Create Heroku app
heroku create sire-backend

# Set environment variables
heroku config:set API_KEY=$(openssl rand -hex 32)
heroku config:set REQUIRE_TICKET_ID=false
heroku config:set LOG_LEVEL=info

# Deploy
git push heroku main

# Open app
heroku open /api/health
```

#### Method 2: Deploy Button (One-Click)
The `app.json` file enables one-click deployment:

1. Add this button to your README or share the link:
   ```
   https://heroku.com/deploy?template=https://github.com/Anaxagorius/S.I.R.E./tree/main/SIRE_backend/backend
   ```
2. Click the button
3. Configure app name and environment variables
4. Click "Deploy app"

#### Verification
```bash
curl https://sire-backend.herokuapp.com/api/health \
  -H "x-api-key: YOUR_API_KEY"
```

#### Logs
```bash
heroku logs --tail
```

---

## Health Check & Verification

### Health Endpoint
All cloud platforms support health checks via:
```
GET /api/health
```

**Headers Required:**
- `x-api-key: YOUR_API_KEY`

**Expected Response:**
```json
{
  "status": "ok",
  "timestampIso": "2026-02-10T17:00:00.000Z",
  "requestId": "req_abc123"
}
```

### Testing Session Endpoints

#### Create a Session
```bash
curl -X POST https://your-app.com/api/session \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"name": "Test-Session"}'
```

#### List Sessions
```bash
curl https://your-app.com/api/session \
  -H "x-api-key: YOUR_API_KEY"
```

### Testing Socket.IO Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('https://your-app.com', {
  transports: ['websocket'],
  extraHeaders: {
    'x-api-key': 'YOUR_API_KEY'
  }
});

socket.on('connect', () => {
  console.log('Connected to SIRE backend');
});
```

---

## Production Hardening

### Checklist
- ✅ Health check endpoint implemented (`/api/health`)
- ✅ Structured JSON logging
- ✅ Environment-based configuration
- ✅ API key authentication
- ✅ Request ID tracking
- ✅ Audit logging
- ✅ Security headers middleware
- ✅ Error handling middleware
- ✅ Minimal Docker base image (node:20-alpine)
- ✅ Dependencies locked (package-lock.json)
- ✅ Production-only dependencies in Docker

### Security Best Practices
1. **Never commit API keys** — Use environment variables
2. **Use strong API keys** — Generate with `openssl rand -hex 32`
3. **Enable HTTPS** — All cloud platforms provide free SSL
4. **Set `REQUIRE_API_KEY=true`** in production
5. **Monitor logs** — Use platform logging tools
6. **Set appropriate `LOG_LEVEL`** — Use `info` or `warn` in production
7. **Enable audit logging** — Keep `AUDIT_LOG_ENABLED=true`

### Monitoring
- **Railway**: Built-in metrics and logs
- **Render**: Service dashboard with metrics
- **Heroku**: Heroku CLI (`heroku logs --tail`)

### Auto-Deploy Setup
All platforms support auto-deploy from GitHub:
- **Railway**: Settings → Deploy → Connect to GitHub branch
- **Render**: Settings → Auto-Deploy from branch
- **Heroku**: Deploy tab → GitHub → Enable Automatic Deploys

---

## Troubleshooting

### Common Issues

#### App Crashes on Startup
- **Check logs** for startup errors
- **Verify `NODE_ENV`** is set
- **Ensure `API_KEY`** is configured

#### Health Check Fails
- **Verify API key** is set correctly
- **Check health endpoint** accepts GET requests
- **Ensure `/api/health` path** is correct

#### Port Already in Use (Local)
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

#### Socket.IO Connection Fails
- **Verify API key** in handshake headers
- **Check CORS settings** for frontend domain
- **Ensure WebSocket transport** is enabled

---

## Additional Resources
- [Backend README](../backend/README.md)
- [API Specification](./API_Specification.yaml)
- [Socket.IO Event Catalog](./SocketIO_Event_Catalog.md)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
- [Heroku Node.js Guide](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
