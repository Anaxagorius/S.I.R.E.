
# 🚨 SIRE — Backend

This backend powers the **SIRE**, providing:

- A REST API for health checks, session management, authentication, analytics, and more
- A Socket.IO server for real-time simulation events
- In-memory session storage with SQLite persistence for scenarios, analytics, and user data
- Role-based access control (admin, facilitator, participant)
- Scenario-driven incident drill progression with 490+ built-in scenarios

Built with **Node.js**, **Express**, **Socket.IO**, and **better-sqlite3** using modern **ESM (`.mjs`) modules**.

📚 **[Full Deployment Guide](../docs/Deployment_Guide.md)** — Local, Docker, and Cloud deployment instructions

---

# ☁️ Quick Deploy

Deploy the backend to a free-tier cloud provider with one click:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/Anaxagorius/S.I.R.E./tree/main/SIRE_backend/backend)

**Other Platforms:**
- **Render**: Create new Web Service from [render.com](https://render.com) using `render.yaml`
- **Heroku**: [Deploy to Heroku](https://heroku.com/deploy?template=https://github.com/Anaxagorius/S.I.R.E./tree/main/SIRE_backend/backend)

📖 **Detailed deployment guides**: See [Deployment Guide](../docs/Deployment_Guide.md) and [Quick Start](../docs/Cloud_Deployment_Quickstart.md)

---

# ☁️ Render Deployment

Deploy the **backend** (`s-i-r-e`) and **frontend** (`s-i-r-e-frontend`) to Render using the
blueprint at the repo root.

> 📖 **Full step-by-step guide (including admin dashboard troubleshooting):**
> [`RENDER_DEPLOYMENT.md`](../../RENDER_DEPLOYMENT.md)

## Deploy via Blueprint (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com) → **New → Blueprint**.
2. Connect the `Anaxagorius/S.I.R.E.` repository.
3. Render detects the root `render.yaml` and creates both services automatically:
   - **`s-i-r-e`** — Node web service for the backend API + Socket.IO.
   - **`s-i-r-e-frontend`** — Static site for the React frontend.
4. `VITE_API_BASE` and `ALLOWED_ORIGINS` are wired automatically between services via
   Render's `fromService` Blueprint feature — no manual configuration required.
5. API key enforcement is **disabled** (`REQUIRE_API_KEY=false`) so the frontend and
   backend communicate without additional secrets.

> ⚠️ **Free-tier spin-down:** The backend sleeps after 15 minutes of inactivity. The first
> request after waking can take up to 60 seconds. Open
> `https://s-i-r-e.onrender.com/api/health` to wake the service before running a session.

## Manual Deploy (Backend Only)

1. **New → Web Service** → connect repo → set **Root Directory** to `SIRE_backend/backend`.
2. **Build Command:** `npm ci`
3. **Start Command:** `npm start`
4. **Health Check Path:** `/api/health`
5. Add the following **Environment Variables**:

   | Variable | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | |
   | `LOG_LEVEL` | `info` | |
   | `SESSION_MAX_TRAINEES` | `10` | |
   | `REQUIRE_API_KEY` | `false` | No API key needed for Blueprint deployment |
   | `REQUIRE_TICKET_ID` | `false` | |
   | `AUDIT_LOG_ENABLED` | `true` | |
   | `CODEBASE_CONTEXT` | `SIRE_backend` | |
   | `ALLOWED_ORIGINS` | `https://s-i-r-e-frontend.onrender.com` | Exact frontend URL, no trailing slash |

> **Note:** Do **not** set `PORT` — Render injects it automatically.
>
> When deploying manually (not via Blueprint) you must also deploy the frontend and set
> `VITE_API_BASE` on it before the first build. See
> [`RENDER_DEPLOYMENT.md`](../../RENDER_DEPLOYMENT.md) for the full manual-deploy steps.

---

# 🚀 Quick Start

```bash
cp .env.example .env   # Windows: copy .env.example .env
npm install
npm run dev
```

The server will start on the configured port (default: `8080`) and **auto-restarts on every file change** via `node --watch` — no manual restart needed during development.

The `.env` file (copied from `.env.example`) controls all runtime options. By default `REQUIRE_API_KEY=true` and `API_KEY=local-dev-key`. To override the API key inline:

```bash
API_KEY=local-dev-key npm run dev
```

---

# 🔒 CORS Configuration

The backend supports configurable CORS (Cross-Origin Resource Sharing) policies for enhanced security in production deployments.

## Development (Permissive CORS)

By default, the server allows requests from any origin (`*`):

```bash
npm run dev
```

## Production (Restricted CORS)

For production deployments, restrict CORS to specific origins using the `ALLOWED_ORIGINS` environment variable:

```bash
ALLOWED_ORIGINS=https://sire.example.com,https://app.sire.example.com npm start
```

### Docker/Cloud Deployment

Update your `docker-compose.yml` or cloud configuration:

```yaml
environment:
  - ALLOWED_ORIGINS=https://sire.example.com,https://app.sire.example.com
```

### Important Notes

- **Multiple origins**: Separate with commas (no spaces)
- **Wildcard**: Use `ALLOWED_ORIGINS=*` for development only
- **Applies to both**: REST API and Socket.IO connections
- **Credentials**: Automatically handled (enabled for specific origins, disabled for wildcard)

---

# 📁 Project Structure

```
src/
  server.mjs                      # Application entrypoint (Express + Socket.IO)
  config/
    auditLogger.mjs               # Audit-trail logger
    environmentConfig.mjs         # Port + environment settings
    logger.mjs                    # Application logger
    securityConfig.mjs            # CORS / security configuration
  controllers/
    sessionController.mjs         # Session CRUD controller
  middleware/
    authMiddleware.mjs            # JWT auth + role enforcement (requireAuth, requireRole)
    errorHandler.mjs              # Centralised error handler
    securityHeaders.mjs           # HTTP security headers
  models/
    inMemorySessionStore.mjs      # Volatile session store (RAM)
    sireDatabase.mjs              # SQLite persistence (scenarios, analytics, documents, …)
    tokenStore.mjs                # In-memory JWT token store
    types.mjs                     # Shared type definitions
    userDatabase.mjs              # User account store (RBAC)
  routes/
    actionTaskRoute.mjs           # /api/action-tasks
    analyticsRoute.mjs            # /api/analytics
    authRoute.mjs                 # /api/login, /api/signup, /api/me, /api/users
    emsRoute.mjs                  # /api/ems/sessions/:code/mci
    healthRoute.mjs               # /api/health
    integrationsRoute.mjs         # /api/integrations
    scenarioRoute.mjs             # /api/scenarios
    sessionRoute.mjs              # /api/session (legacy CRUD)
    sessionsRoute.mjs             # /api/sessions/:code
  services/
    escalationService.mjs         # Timeline pause/resume + inject delivery
    scenarioRegistry.mjs          # Scenario lookup (DB → filesystem)
    sessionService.mjs            # Business logic for sessions
  sockets/
    socketServer.mjs              # Socket.IO namespace /sim + all event handlers
  utils/
    auditContext.mjs              # Request-scoped audit context
    validation.mjs                # Input validation helpers
  scenarios/
    *.json                        # 490+ built-in incident drill scenario definitions
```

---

# 📘 API Documentation

## Base URL

```
http://localhost:8080/api
```

---

## 🩺 Health Endpoint

### **GET /health**

Returns backend uptime info and timestamp.

**Response**

```json
{
  "status": "ok",
  "timestampIso": "2026-01-28T15:47:44.914Z"
}
```

---

## 📁 Session Endpoints

### **GET /session**

List all active sessions.

### **POST /session**

Create a new simulation session.

```json
{
  "name": "Phishing-Scenario-001"
}
```

### **GET /session/:id**

Retrieve a single session.

### **DELETE /session/:id**

Terminate and remove a session.

---

# ⚡ Socket.IO Events

The backend exposes a WebSocket server on the **same port** as the REST API.

## 🔌 Connecting

```js
import { io } from "socket.io-client";
// Connect to the /sim namespace using the auth payload (browser-safe)
const socket = io("http://localhost:8080/sim", {
  transports: ["websocket"],
  auth: { apiKey: "YOUR_API_KEY" }
});
```

---

# 🧪 Testing the API

### Health

```
curl.exe http://127.0.0.1:8080/api/health ^
  -H "x-api-key: local-dev-key"
```

### Create a Session

```
curl.exe -X POST http://127.0.0.1:8080/api/session ^
  -H "Content-Type: application/json" ^
  -H "x-api-key: local-dev-key" ^
  -H "x-ticket-id: SIRE-1234" ^
  -d "{"name": "Phishing-Scenario-001"}"
```

### Delete a Session

```
curl.exe -X DELETE http://127.0.0.1:8080/api/session/<SESSION_CODE> ^
  -H "x-api-key: local-dev-key" ^
  -H "x-ticket-id: SIRE-1234"
```

---

# 🛠️ Tech Stack

- Node.js 20+
- Express (REST)
- Socket.IO (real-time)
- better-sqlite3 (SQLite persistence)
- ESM / .mjs modules
- In-memory + SQLite data models

---

# 🔄 Updating & Restarting Services

## Development Mode

Both services **auto-reload** during local development — you do **not** need to shut them down when you save code changes:

| Service | Reload mechanism | Restart needed on code change? |
|---|---|---|
| **Backend** (`npm run dev`) | `node --watch` auto-restarts on every `.mjs` / `.json` file change | ❌ No |
| **Frontend** (`npm run dev`) | Vite Hot Module Replacement (HMR) refreshes the browser instantly | ❌ No |

> **Exception — `.env` changes**: If you edit the backend `.env` file, the `node --watch`
> process detects the change and restarts automatically. If you edit the frontend `.env`
> file, stop the Vite dev server (`Ctrl+C`) and restart it with `npm run dev` for the
> new values to take effect — Vite does not hot-reload `.env` changes.

## Production / Cloud (Render, Railway, Heroku)

On cloud platforms, which service needs to be restarted depends on *what* changed:

| What changed | Restart `sire-api` (backend)? | Redeploy `sire-web` (frontend)? |
|---|---|---|
| Backend source code | ✅ Yes (auto-deploy on push) | ❌ No |
| Frontend source code | ❌ No | ✅ Yes (auto-deploy on push) |
| Backend env var (e.g. `API_KEY`, `ALLOWED_ORIGINS`) | ✅ Yes — restart via platform dashboard | ❌ No |
| Frontend build-time env var (e.g. `VITE_API_BASE`, `VITE_API_KEY`) | ❌ No | ✅ Yes — must **redeploy** to rebuild with new value |
| Both backend and frontend changes | ✅ Yes | ✅ Yes |

### Recommended order when restarting both

1. Restart / redeploy **`sire-api`** (backend) first.
2. Wait for the backend health check to pass: `GET /api/health`.
3. Then redeploy **`sire-web`** (frontend) so the Vite build picks up the latest `VITE_API_KEY`.

> ⚠️ **Session data is lost on any backend restart.** Active training sessions will be
> cleared because the server uses in-memory storage. Inform participants before restarting.

---

# ⚠️ Data Persistence & Limitations

## In-Memory Session Storage

**IMPORTANT:** This backend uses **in-memory session storage only** (see `src/models/inMemorySessionStore.mjs`). All session data is **volatile** and stored in RAM.

### What This Means:

- ✅ **Zero external dependencies** - No database or Redis required
- ✅ **Fast and simple** - Perfect for demos and academic training
- ❌ **Sessions are lost on restart** - Any server restart, redeployment, or crash will **clear all sessions**
- ❌ **Not production-ready** - Not suitable for environments requiring data persistence

### Current Intended Use:

This backend is designed for:
- **Demo and academic environments**
- **Short-lived training sessions** (minutes to hours)
- **Development and testing**
- **Proof-of-concept deployments**

### Production Considerations:

If you need persistent session storage for production use, you should implement:

1. **Database Backend**: 
   - PostgreSQL, MySQL, or MongoDB for durable storage
   - ORM/ODM integration (e.g., Sequelize, TypeORM, Mongoose)

2. **Distributed Cache**:
   - Redis for fast, persistent session storage
   - Supports clustering and replication

3. **Session Store Middleware**:
   - Use `express-session` with a persistent store adapter
   - Options: `connect-redis`, `connect-mongo`, `connect-pg-simple`

4. **Stateful Architecture**:
   - External state management service
   - Event sourcing for audit trails
   - Backup and restore capabilities

**For academic and demo purposes, the current in-memory implementation is intentional and sufficient.**

---

# 🔐 Security & Compliance Defaults

- REST requests require `x-api-key` (set `API_KEY` env var).
- Mutations require `x-ticket-id` for change tracking.
- Socket.IO connections require the API key via the `auth` payload
  (`auth: { apiKey }`) — this is the browser-safe approach.
  Header-based auth (`extraHeaders`) is accepted as a backward-compatible
  fallback for Node.js clients.
- Set `REQUIRE_API_KEY=false` or `REQUIRE_TICKET_ID=false` only for local development.

---

# 📋 Scenario Library

The backend ships with **490+ incident response scenarios** spanning cybersecurity, fire, law enforcement, EMS, natural disasters, and more. Each scenario has **5–7 escalation events** designed for realistic training exercises.

## Scenario Categories

| Category | Examples |
|---|---|
| **Cybersecurity** | Ransomware, phishing, DDoS, insider threat, supply-chain compromise, zero-day exploit |
| **Fire & Rescue** | Structure fires, wildfire, hazmat, vehicle fire, fireground mayday, mass-casualty |
| **Law Enforcement** | Use of force, pursuit termination, missing persons, gang response, warrant execution |
| **EMS / Medical** | Cardiac arrest, MCI triage, burn victim, pediatric trauma, firefighter mayday |
| **Natural Disaster** | Earthquake, flood, severe weather, extreme heat, hurricane aftermath |
| **Infrastructure** | Power outage, network failure, database crash, cloud outage, DNS poisoning |

## Scenario Design Approach

Each scenario follows emergency management best practices:

- **Progressive Escalation**: Events build in severity and complexity
- **Realistic Timelines**: Time intervals range from 5 seconds to 5 minutes based on incident type
- **Decision Points**: Each event requires trainee assessment and action
- **Complete Lifecycle**: From detection through resolution and recovery

## Adding Custom Scenarios

Use the **Scenario Builder** UI (`/scenario-builder`) or send a `POST /api/scenarios` request with a scenario JSON body. Custom scenarios are stored in SQLite and take precedence over built-in filesystem scenarios.

## Testing a Scenario

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Create a session** via REST API and **start a scenario** via Socket.IO

3. **Observe event progression** — events fire based on `timeOffsetSec` values

Each scenario completes in 2–5 minutes, making them suitable for training sessions while maintaining realistic pacing.

---

# 🏁 Status

✔ Backend functional  
✔ REST + Socket.IO operational  
✔ Sessions + scenarios supported  
✔ ESM conversion complete  
✔ 490+ scenarios across cybersecurity, fire, law enforcement, EMS, and more  
✔ Role-based access control (admin / facilitator / participant)  
✔ SQLite persistence for scenarios, analytics, and user data  
✔ Cloud deployment ready (Render Blueprint recommended)

---

# 📚 Additional Documentation

- [Deployment Guide](../docs/Deployment_Guide.md) - Comprehensive deployment instructions
- [Cloud Deployment Quickstart](../docs/Cloud_Deployment_Quickstart.md) - Quick reference for cloud deployment
- [API Specification](../docs/API_Specification.yaml) - OpenAPI spec
- [Socket.IO Event Catalog](../docs/SocketIO_Event_Catalog.md) - Real-time event reference
