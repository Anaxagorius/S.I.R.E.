# Cloud Deployment Quick Start

This guide provides streamlined deployment steps for Railway, Render, and Heroku.

## Prerequisites
- GitHub account connected to the repository
- Cloud provider account (Railway/Render/Heroku)
- Generated API key (e.g., using `openssl rand -hex 32`)

---

## Railway (Recommended)

### Deploy Steps
1. Visit [railway.app](https://railway.app) and sign in
2. Click **New Project** → **Deploy from GitHub repo**
3. Select `Anaxagorius/S.I.R.E.` repository
4. Set **Root Directory**: `SIRE_backend/backend`
5. Railway auto-detects `railway.json` configuration

### Environment Variables
Add in Railway dashboard → **Variables**:
```
API_KEY=<generate-secure-random-key>
REQUIRE_TICKET_ID=false
```

### Deploy
Railway automatically builds and deploys. Monitor progress in the dashboard.

### Test
```bash
curl https://your-app.railway.app/api/health \
  -H "x-api-key: YOUR_API_KEY"
```

---

## Render

### Deploy Steps
1. Visit [render.com](https://render.com) and sign in
2. Click **New +** → **Web Service**
3. Connect GitHub repository: `Anaxagorius/S.I.R.E.`
4. Configure:
   - **Root Directory**: `SIRE_backend/backend`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`

### Environment Variables
Add in Render dashboard → **Environment**:
```
API_KEY=<generate-secure-random-key>
REQUIRE_TICKET_ID=false
LOG_LEVEL=info
```

### Deploy
Render automatically builds and deploys on commit.

### Test
```bash
curl https://sire-backend.onrender.com/api/health \
  -H "x-api-key: YOUR_API_KEY"
```

---

## Heroku

### Deploy via CLI
```bash
# Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Navigate to backend
cd SIRE_backend/backend

# Create app
heroku create sire-backend-demo

# Set environment variables
heroku config:set API_KEY=$(openssl rand -hex 32)
heroku config:set REQUIRE_TICKET_ID=false
heroku config:set LOG_LEVEL=info

# Deploy
git subtree push --prefix SIRE_backend/backend heroku main

# Verify
heroku open /api/health
```

### One-Click Deploy
Alternatively, use the deploy button:
```
https://heroku.com/deploy?template=https://github.com/Anaxagorius/S.I.R.E./tree/main/SIRE_backend/backend
```

### Test
```bash
curl https://sire-backend-demo.herokuapp.com/api/health \
  -H "x-api-key: YOUR_API_KEY"
```

---

## Verification Checklist

After deployment, verify:
- [ ] Health endpoint responds: `GET /api/health`
- [ ] Can create session: `POST /api/session`
- [ ] Can list sessions: `GET /api/session`
- [ ] Socket.IO connects successfully
- [ ] API key authentication works
- [ ] Application logs are visible in platform dashboard

---

## Next Steps

1. **Configure Auto-Deploy**:
   - Railway: Settings → Deploy → Connect to GitHub branch
   - Render: Settings → Auto-Deploy from branch
   - Heroku: Deploy tab → Enable Automatic Deploys

2. **Monitor Performance**:
   - Check application logs
   - Monitor health check status
   - Review platform metrics

3. **Update Frontend**:
   - Configure frontend to use deployed backend URL
   - Update Socket.IO connection string
   - Set API key in frontend environment variables

---

## Troubleshooting

### Build Fails
- Verify Node version (20+) in `package.json` engines
- Check `package-lock.json` exists
- Review build logs for npm errors

### App Crashes
- Check logs for startup errors
- Verify `API_KEY` environment variable is set
- Ensure `PORT` is not hardcoded (platforms auto-assign)

### Health Check Fails
- Verify `/api/health` path
- Check API key header: `x-api-key`
- Ensure app is listening on correct port

For detailed documentation, see [Deployment_Guide.md](./Deployment_Guide.md).
