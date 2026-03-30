# 🚀 Render Free-Tier Deployment Guide — S.I.R.E.

This guide walks you through deploying the full S.I.R.E. stack (backend API + React frontend) on [Render's free tier](https://render.com/) using the **Blueprint** method, which is the only reliable way to make the admin dashboard work correctly.

---

## How the two services connect

```
Browser ──fetch──► s-i-r-e-frontend (Static Site)
                            │
                    VITE_API_BASE (build-time)
                            │
                            ▼
                   s-i-r-e (Web Service / Node)
                    ALLOWED_ORIGINS = frontend URL
```

Both environment variables are wired automatically by the root `render.yaml` via Render's
`fromService` feature. **If you deploy the services separately (not as a Blueprint), you must
set these variables by hand — and the admin dashboard will fail until you do.**

---

## Part 1 — Blueprint Deployment (Recommended)

The `render.yaml` at the repository root deploys both services and wires them together automatically.

### Step 1 — Sign in to Render

Go to <https://dashboard.render.com> and sign in or create a free account.

### Step 2 — Create a new Blueprint

1. Click **New +** in the top-right corner.
2. Select **Blueprint** (not "Web Service" and not "Static Site").
3. Connect your GitHub account if prompted, then select the `Anaxagorius/S.I.R.E.` repository.
4. Leave the **Branch** as `main` and click **Connect**.

### Step 3 — Review services and click Apply

Render reads `render.yaml` from the root of the repository and shows a preview:

| Service | Type | Plan |
|---|---|---|
| `s-i-r-e` | Web Service | Free |
| `s-i-r-e-frontend` | Static Site | Free |

Click **Apply** to start the deployment.

### Step 4 — Wait for both services to go live

Render deploys the backend (`s-i-r-e`) first, then triggers the frontend (`s-i-r-e-frontend`)
build with `VITE_API_BASE` automatically set to the backend's public URL.

> **This can take 5–10 minutes for a first deploy.**

Watch the progress in the Render dashboard. Both services must reach **Live** status.

### Step 5 — Verify

Once both services are live, open the frontend URL (shown on the `s-i-r-e-frontend` service
page). Navigate to the **Admin Dashboard** — you should see scenarios loading immediately.

---

## Part 2 — Manual Deployment (If Blueprint Doesn't Work)

Deploy the services individually in the correct order when you cannot or do not want to use
the Blueprint.

### Step A — Deploy the backend

1. Click **New +** → **Web Service**.
2. Connect the `Anaxagorius/S.I.R.E.` repository.
3. Fill in:

   | Field | Value |
   |---|---|
   | **Name** | `s-i-r-e` |
   | **Runtime** | Node |
   | **Root Directory** | `SIRE_backend/backend` |
   | **Build Command** | `npm ci` |
   | **Start Command** | `npm start` |
   | **Plan** | Free |
   | **Health Check Path** | `/api/health` |

4. Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `LOG_LEVEL` | `info` |
   | `SESSION_MAX_TRAINEES` | `10` |
   | `REQUIRE_API_KEY` | `false` |
   | `REQUIRE_TICKET_ID` | `false` |
   | `AUDIT_LOG_ENABLED` | `true` |
   | `CODEBASE_CONTEXT` | `SIRE_backend` |
   | `ALLOWED_ORIGINS` | *(leave blank for now — fill in after the frontend is deployed)* |

   > **Do not set `PORT`** — Render injects it automatically.

5. Click **Create Web Service** and wait for it to reach **Live** status.
6. Copy the backend URL (e.g., `https://s-i-r-e.onrender.com`) from the service page.

### Step B — Deploy the frontend

1. Click **New +** → **Static Site**.
2. Connect the same repository.
3. Fill in:

   | Field | Value |
   |---|---|
   | **Name** | `s-i-r-e-frontend` |
   | **Root Directory** | `SIRE_frontend` |
   | **Build Command** | `npm ci && npm run build` |
   | **Publish Directory** | `dist` |

4. Under **Environment Variables**, add:

   | Key | Value | Notes |
   |---|---|---|
   | `VITE_API_BASE` | `https://s-i-r-e.onrender.com` | The backend URL from Step A. No trailing slash. Do **not** append `/api` — the client does it automatically. |

   > ⚠️ **`VITE_API_BASE` must be set before the build runs.** It is baked into the
   > JavaScript bundle at build time. If it is missing the frontend silently falls back to
   > `http://localhost:8080`, which is unreachable in production and causes every API call
   > (including scenario loading) to fail with "Failed to fetch".

5. Under **Redirects/Rewrites**, add:

   | Source | Destination | Action |
   |---|---|---|
   | `/*` | `/index.html` | Rewrite |

   This makes React Router work on page refresh.

6. Click **Create Static Site** and wait for the build to complete.
7. Copy the frontend URL (e.g., `https://s-i-r-e-frontend.onrender.com`).

### Step C — Update `ALLOWED_ORIGINS` on the backend

Without this the browser blocks every API call with a CORS error.

1. Open the `s-i-r-e` service in the Render dashboard.
2. Go to **Environment**.
3. Set `ALLOWED_ORIGINS` to the frontend URL from Step B — **exact match, no trailing slash**:

   ```
   ALLOWED_ORIGINS=https://s-i-r-e-frontend.onrender.com
   ```

4. Click **Save Changes** — Render restarts the backend automatically.
5. Wait for the backend to show **Live** again before testing.

---

## Part 3 — Render Free-Tier Limitations

### Service spin-down

Free-tier **web services** (the backend) spin down after **15 minutes of inactivity**.
The next request that wakes the service can take **up to 60 seconds** to respond.

**What you will see:** The admin dashboard shows "Loading scenarios..." for up to a minute
when the backend is waking from sleep. This is normal on the free tier. The request will
eventually succeed — do not refresh the page.

**Workaround:** Open the backend health endpoint in a browser tab before running a session:

```
https://s-i-r-e.onrender.com/api/health
```

If you see `{"status":"ok",...}` the backend is awake. Refresh the admin dashboard immediately.

> Free-tier static sites (the frontend) are always available — only the backend sleeps.

### Session data is volatile

The backend stores all sessions in memory. Any restart (including spin-down/wake-up) **clears all active sessions**. Inform participants before restarting or letting the backend sleep during a live exercise.

---

## Part 4 — Verifying the Deployment

### 1. Check the backend health

```bash
curl https://s-i-r-e.onrender.com/api/health
```

Expected:

```json
{"status":"ok","timestampIso":"2026-03-30T00:00:00.000Z","requestId":"..."}
```

> No API key is required — the health endpoint is public.

### 2. Check that scenarios load

```bash
curl https://s-i-r-e.onrender.com/api/scenarios
```

Expected: a JSON array of 8 scenario objects (`scenario_fire`, `scenario_flood`, etc.).

### 3. Open the admin dashboard

Navigate to your frontend URL and click into the **Admin Dashboard**. You should see the
8 scenario cards. If you see "Loading scenarios..." for more than 60 seconds, the backend
is still waking up.

### 4. Create a test session

Click a scenario card in the admin dashboard. If a session code appears in the "Session
Info" card, the full stack is working.

---

## Part 5 — Troubleshooting

### "Failed to fetch" / "Network Error" in the admin dashboard

**Cause:** `VITE_API_BASE` was not set (or was set incorrectly) when the frontend was built.

**Fix:**
1. Open the `s-i-r-e-frontend` service → **Environment**.
2. Verify `VITE_API_BASE` is set to `https://s-i-r-e.onrender.com` (or your actual backend URL).
3. Click **Manual Deploy** → **Deploy latest commit** to rebuild with the correct value.

### Scenarios show "Failed to load scenarios." error

**Most likely cause:** The backend is either still sleeping or `ALLOWED_ORIGINS` is not
configured, causing a CORS block.

1. Visit `https://s-i-r-e.onrender.com/api/health` to wake the backend.
2. Open your browser's DevTools → **Console** or **Network** tab and reload the admin dashboard.
   - If you see a `CORS` error: go to the backend service → **Environment** → verify
     `ALLOWED_ORIGINS` exactly matches the frontend URL.
   - If you see a network timeout: the backend is still waking up — wait and retry.

### CORS error in browser console

```
Access to fetch at 'https://s-i-r-e.onrender.com/api/...' from origin
'https://s-i-r-e-frontend.onrender.com' has been blocked by CORS policy
```

**Fix:** On the `s-i-r-e` backend service → **Environment**, set:

```
ALLOWED_ORIGINS=https://s-i-r-e-frontend.onrender.com
```

Save and wait for the service to restart.

### Blueprint shows "Service already exists" error

If you previously deployed the services manually, Render may refuse to re-create them via
Blueprint. Either:
- Delete the existing services (`s-i-r-e` and `s-i-r-e-frontend`) and re-run the Blueprint, **or**
- Continue with the manual deployment steps in Part 2.

### The frontend URL is different from `s-i-r-e-frontend.onrender.com`

Render may assign a different subdomain if the name `s-i-r-e-frontend` is already taken. In
that case, use the actual URL shown in your dashboard everywhere this guide says
`https://s-i-r-e-frontend.onrender.com`.

### The admin dashboard loads but Socket.IO does not connect

Socket.IO requires the backend to be awake. Wake the backend (see spin-down section above)
then reload the admin dashboard.

---

## Part 6 — Updating After Code Changes

| What changed | What to do |
|---|---|
| Backend source code | Push to `main` — Render auto-deploys the backend |
| Frontend source code | Push to `main` — Render auto-deploys the frontend |
| Backend env var | Dashboard → `s-i-r-e` → **Environment** → save → waits for restart |
| `VITE_API_BASE` (frontend env var) | Dashboard → `s-i-r-e-frontend` → **Manual Deploy** to rebuild |
| Both changed | Restart **backend first**, wait for health check, then redeploy **frontend** |

---

## Quick Reference — Environment Variables

### Backend (`s-i-r-e` web service)

| Variable | Value | Set by |
|---|---|---|
| `NODE_ENV` | `production` | render.yaml / manual |
| `LOG_LEVEL` | `info` | render.yaml / manual |
| `SESSION_MAX_TRAINEES` | `10` | render.yaml / manual |
| `REQUIRE_API_KEY` | `false` | render.yaml / manual |
| `REQUIRE_TICKET_ID` | `false` | render.yaml / manual |
| `AUDIT_LOG_ENABLED` | `true` | render.yaml / manual |
| `CODEBASE_CONTEXT` | `SIRE_backend` | render.yaml / manual |
| `ALLOWED_ORIGINS` | `https://s-i-r-e-frontend.onrender.com` | **render.yaml auto-wires; manual deploy: set by hand** |
| `PORT` | *(auto-set by Render)* | — |

### Frontend (`s-i-r-e-frontend` static site)

| Variable | Value | Set by |
|---|---|---|
| `VITE_API_BASE` | `https://s-i-r-e.onrender.com` | **render.yaml auto-wires; manual deploy: set by hand** |
