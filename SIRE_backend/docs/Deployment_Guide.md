
# Deployment & Production Guide

## Environments
- **Local:** Node 20+, `.env` file for configuration.  
- **Containerized:** Dockerfile + docker-compose for local orchestration.  
- **CI:** Node LTS install, lint, unit tests, artifact.

## Environment Variables
- `PORT` — HTTP port (default 8080)
- `LOG_LEVEL` — `debug|info|warn|error`
- `SESSION_MAX_TRAINEES` — default 10
- `API_KEY` — API key required for REST and Socket.IO
- `REQUIRE_API_KEY` — set `false` to disable auth locally
- `TICKET_HEADER` — header name for ticket IDs (default `x-ticket-id`)
- `REQUIRE_TICKET_ID` — set `false` to disable ticket enforcement
- `AUDIT_LOG_ENABLED` — set `false` to disable audit logs
- `CODEBASE_CONTEXT` — audit log context label (default `SIRE_backend`)

## Steps (Local)
```bash
npm install
npm run dev
```

## Docker
```bash
docker compose up --build
```

## Cloud Deployment

This section covers deploying the SIRE backend to popular cloud platforms for demos, grading, or production use.

### Prerequisites
- Git repository access (GitHub, GitLab, etc.)
- Active account on your chosen platform (Heroku, Railway, or Render)
- Backend code with `package.json`, `Dockerfile`, and health endpoint

### Supported Platforms

#### Option 1: Heroku

**Step 1: Create an Account & Project**
1. Sign up at [heroku.com](https://heroku.com)
2. Install the Heroku CLI: `npm install -g heroku`
3. Login: `heroku login`
4. Create a new app:
   ```bash
   heroku create your-sire-backend
   ```

**Step 2: Configure Environment Variables**
1. Via Dashboard:
   - Go to your app → Settings → Config Vars
   - Add the following keys:
     - `API_KEY` = `your-secure-api-key`
     - `LOG_LEVEL` = `info`
     - `SESSION_MAX_TRAINEES` = `10`
     - `REQUIRE_API_KEY` = `true`
     - `REQUIRE_TICKET_ID` = `false` (or `true` for production)
     - `PORT` = (auto-set by Heroku, no need to configure)

2. Via CLI:
   ```bash
   heroku config:set API_KEY=your-secure-api-key
   heroku config:set LOG_LEVEL=info
   ```

**Step 3: Deploy**
1. Ensure your `package.json` has:
   ```json
   "engines": {
     "node": ">=20"
   }
   ```
2. Add a `Procfile` in your backend root (if using Docker, skip this):
   ```
   web: npm start
   ```
3. Deploy via Git:
   ```bash
   cd SIRE_backend/backend
   git push heroku main
   ```
4. Or deploy using Docker:
   - Heroku automatically detects `Dockerfile`
   - Ensure `heroku.yml` exists (optional):
     ```yaml
     build:
       docker:
         web: Dockerfile
     ```

**Step 4: Verify Deployment**
```bash
# Check logs
heroku logs --tail

# Test health endpoint
curl https://your-sire-backend.herokuapp.com/api/health \
  -H "x-api-key: your-secure-api-key"
```

---

#### Option 2: Railway

**Step 1: Create an Account & Project**
1. Sign up at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub account and select the SIRE repository
4. Choose the `SIRE_backend/backend` directory as the root

**Step 2: Configure Environment Variables**
1. In Railway dashboard:
   - Go to your service → Variables tab
   - Add:
     - `API_KEY` = `your-secure-api-key`
     - `LOG_LEVEL` = `info`
     - `SESSION_MAX_TRAINEES` = `10`
     - `REQUIRE_API_KEY` = `true`
     - `REQUIRE_TICKET_ID` = `false`
     - `PORT` = `8080` (Railway auto-injects PORT, but you can override)

**Step 3: Configure Build Settings**
1. Railway auto-detects Node.js or Docker
2. For Docker deployment:
   - Railway automatically uses your `Dockerfile`
   - No additional configuration needed
3. For Node.js deployment:
   - Build Command: `npm install`
   - Start Command: `npm start`

**Step 4: Deploy**
1. Railway automatically deploys on every push to your connected branch
2. Or trigger manual deployment:
   - Click "Deploy" in the dashboard
   - Select the branch to deploy

**Step 5: Verify Deployment**
```bash
# Railway provides a public URL (e.g., https://sire-backend-production.up.railway.app)
curl https://your-app.up.railway.app/api/health \
  -H "x-api-key: your-secure-api-key"
```

---

#### Option 3: Render

**Step 1: Create an Account & Project**
1. Sign up at [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub/GitLab repository
4. Select the SIRE repository

**Step 2: Configure Service Settings**
1. **Name**: `sire-backend`
2. **Region**: Choose closest to your users
3. **Branch**: `main` (or your deployment branch)
4. **Root Directory**: `SIRE_backend/backend`
5. **Runtime**: `Docker` (if using Dockerfile) or `Node`
6. **Build Command** (if not using Docker): `npm install`
7. **Start Command** (if not using Docker): `npm start`
8. **Instance Type**: Free tier or paid tier based on needs

**Step 3: Configure Environment Variables**
1. In the Render dashboard → Environment section:
   - Add:
     - `API_KEY` = `your-secure-api-key`
     - `LOG_LEVEL` = `info`
     - `SESSION_MAX_TRAINEES` = `10`
     - `REQUIRE_API_KEY` = `true`
     - `REQUIRE_TICKET_ID` = `false`
     - `PORT` = `8080` (Render auto-injects PORT variable)

**Step 4: Deploy**
1. Click "Create Web Service"
2. Render automatically builds and deploys
3. For subsequent deployments:
   - Auto-deploys on git push to connected branch
   - Or click "Manual Deploy" → "Deploy latest commit"

**Step 5: Verify Deployment**
```bash
# Render provides a URL like https://sire-backend.onrender.com
curl https://sire-backend.onrender.com/api/health \
  -H "x-api-key: your-secure-api-key"

# Expected response:
# {"status":"ok","timestampIso":"2026-02-10T17:00:00.000Z"}
```

---

### Troubleshooting

#### Common Errors

**1. Port Binding Issues**
- **Symptom**: App crashes with "EADDRINUSE" or "port already in use"
- **Solution**: Ensure your app uses `process.env.PORT` (cloud platforms inject this automatically)
- **Fix**: In `environmentConfig.mjs`, use:
  ```javascript
  httpPort: process.env.PORT || 8080
  ```

**2. 401 Unauthorized on /api/health**
- **Symptom**: Health check returns 401 or "Missing API key"
- **Solution**: 
  - Verify `API_KEY` environment variable is set
  - Include `x-api-key` header in all requests
  - For initial testing, set `REQUIRE_API_KEY=false` (not recommended for production)

**3. Build Failures**
- **Symptom**: "MODULE_NOT_FOUND" or build exits with error
- **Solution**:
  - Ensure `package.json` and `package-lock.json` are committed
  - Check Node.js version matches `engines` field (>=20)
  - Review platform build logs for specific errors

**4. WebSocket Connection Failures**
- **Symptom**: Socket.IO client cannot connect
- **Solution**:
  - Ensure your platform supports WebSocket connections (all three do)
  - Use `transports: ['websocket', 'polling']` as fallback
  - Check CORS configuration allows your frontend domain

**5. Application Logs Not Showing**
- **Symptom**: No logs visible in platform dashboard
- **Solution**:
  - Ensure `LOG_LEVEL` is set to `info` or `debug`
  - Use `console.log` or structured logger (already configured)
  - Check platform-specific logging documentation

**6. Cold Start Delays**
- **Symptom**: First request after inactivity is slow
- **Solution**:
  - Expected behavior on free tiers (apps sleep after inactivity)
  - Upgrade to paid tier for always-on instances
  - Implement health check pinging (external monitoring)

---

### Deployment Verification Checklist

Before marking your deployment complete, verify:

- [ ] **Health Endpoint**: `GET /api/health` returns `{"status":"ok"}` with 200 status
- [ ] **Environment Variables**: All required vars are set (API_KEY, LOG_LEVEL, etc.)
- [ ] **API Authentication**: Requests with valid `x-api-key` header succeed
- [ ] **Session Creation**: `POST /api/session` successfully creates a session
- [ ] **Session Listing**: `GET /api/session` returns session list
- [ ] **Socket.IO Connection**: WebSocket client can connect to `/` namespace
- [ ] **Logs Available**: Application logs are accessible in platform dashboard
- [ ] **Build Success**: Latest deployment shows "Live" or "Running" status
- [ ] **HTTPS Enabled**: Platform provides HTTPS URL (automatic on all platforms)
- [ ] **CORS Configured**: Frontend can communicate if on different domain
- [ ] **Port Configuration**: App binds to `process.env.PORT` correctly
- [ ] **No Secrets in Code**: API keys and sensitive data only in environment variables

---

### Security Best Practices

When deploying to production or demo environments:

1. **Use Strong API Keys**: Generate cryptographically secure keys (e.g., `openssl rand -hex 32`)
2. **Enable Authentication**: Set `REQUIRE_API_KEY=true` and `REQUIRE_TICKET_ID=true`
3. **Use HTTPS Only**: Disable HTTP redirect or enforce HTTPS (platforms handle this)
4. **Restrict CORS**: Configure CORS to allow only your frontend domain
5. **Monitor Logs**: Regularly check application logs for suspicious activity
6. **Keep Dependencies Updated**: Run `npm audit` and update vulnerable packages
7. **Use Environment Variables**: Never commit secrets to Git

---

## Production Hardening Checklist
- Health check endpoint, structured logs, graceful shutdown, pinned deps, minimal base image.
