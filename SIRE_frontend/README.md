# S.I.R.E. Frontend

Real-time React-based user interface for the **S.I.R.E. (Simulator for Incident Response Exercises)** training platform.

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Backend server running (see `../SIRE_backend/backend`)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (Vite default port).

### Build for Production

```bash
npm run build
```

## Environment Variables

| Variable | Description | Default (local dev) |
|---|---|---|
| `VITE_API_BASE` | Backend base URL — accepts `http://host`, `https://host`, or `https://host/api` | `http://localhost:8080` |
| `VITE_API_KEY` | API key matching the backend `API_KEY` (leave unset if `REQUIRE_API_KEY=false`) | *(unset)* |

> **Build-time baking:** `VITE_*` variables are statically embedded into the JavaScript
> bundle during `vite build`. Changing them in the platform dashboard requires a full
> **redeploy** of the frontend to take effect.

## Reloading & Updating Services

### Development Mode

You do **not** need to restart the frontend dev server when you edit source files.
Vite uses **Hot Module Replacement (HMR)** — the browser updates instantly on every save.

If you edit `.env` (e.g. change `VITE_API_BASE`), stop the dev server (`Ctrl+C`) and
restart it with `npm run dev` for the new values to take effect.

### Production (Render)

| Scenario | Action required |
|---|---|
| Frontend source code changed | Redeploy `s-i-r-e-frontend` (auto on push if auto-deploy is on) |
| `VITE_API_BASE` changed | **Manually trigger a redeploy** of `s-i-r-e-frontend` |
| Only backend changed | No frontend action needed |

> Always redeploy the **backend first**, confirm it is healthy via `GET /api/health`,
> then redeploy the frontend.

## Features

### Instructor Flow

1. **Create Session** (`/create-session`)
   Select one of 8 built-in scenarios. The backend creates a session and returns a
   6-character session code to share with trainees.

2. **Admin Dashboard** (`/admin-dashboard`)
   - Shows the session code trainees need to join
   - Displays the live trainee roster as participants connect
   - **Start Session** — triggers the automated timeline escalation
   - **Inject Event panel** — broadcast a custom message to all participants with
     severity `info`, `warning`, or `critical`
   - **Live Event Log** — shows timeline ticks, trainee decisions, and injected events
   - **End Session** — moves to the post-session review view

### Trainee Flow

1. **Join Session** (`/join-session`)
   Enter your **display name** and the **session code** provided by the instructor.

2. **Trainee Interface** (`/trainee-interface`)
   - Displays the current scenario decision node (title, situation, question)
   - Select a response option to progress through the branching scenario
   - Each selection is broadcast to the admin's live event log so the instructor can
     monitor trainee decisions in real time
   - Live timeline events from the instructor appear in the "Live Updates" panel

### Demo / Kiosk Mode

- **Demo** (`/demo`) — run any scenario entirely in the browser, no backend required
- **Showcase** (`/showcase`) — static feature showcase slides

## Available Scenarios

1. Fire Emergency
2. Flood
3. Medical Emergency
4. Severe Weather
5. Cyber Attack
6. Hazardous Material Spill
7. Active Threat
8. Power Outage

## Deploying to Render

### Blueprint Deploy (Recommended)

The root `render.yaml` in the repository sets up both services automatically.

1. Go to [Render Dashboard](https://dashboard.render.com) → **New → Blueprint**.
2. Connect the `Anaxagorius/S.I.R.E.` repository.
3. Render creates **`s-i-r-e`** (backend Node service) and **`s-i-r-e-frontend`**
   (static site) from the Blueprint.
4. `VITE_API_BASE` is automatically wired to the backend service URL via `fromService`.
5. `ALLOWED_ORIGINS` on the backend is automatically set to the frontend URL.
6. No API key required — the Blueprint sets `REQUIRE_API_KEY=false`.

### Manual Deploy (Frontend Only)

1. **New → Static Site** → connect repo → set **Root Directory** to `SIRE_frontend`.
2. **Build Command:** `npm ci && npm run build`
3. **Publish Directory:** `dist`
4. Add a **Rewrite Rule:** `/* → /index.html` (required for client-side routing).
5. Add the following **Environment Variable** (build-time):

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE` | `https://s-i-r-e.onrender.com` |

> The backend must have `ALLOWED_ORIGINS` set to the frontend's exact origin with no
> trailing slash, e.g. `ALLOWED_ORIGINS=https://s-i-r-e-frontend.onrender.com`.

## Troubleshooting

### Frontend cannot reach backend

- Confirm backend is healthy: `GET /api/health`
- Open browser **Console** and **Network** tabs and look for failed requests
- Verify `VITE_API_BASE` is set correctly and the frontend has been **redeployed**
  after the change

### CORS errors

- Ensure the backend `ALLOWED_ORIGINS` env var contains the exact frontend origin
  (e.g. `https://s-i-r-e-frontend.onrender.com`) with no trailing slash
- Restart the backend service after changing `ALLOWED_ORIGINS`

### Socket.IO not connecting

- Verify the backend Socket.IO namespace is `/sim`
- If `REQUIRE_API_KEY=true` on the backend, set `VITE_API_KEY` to the matching
  `API_KEY` value and redeploy the frontend

### All trainees appear as "Trainee" in admin dashboard

- Trainees must enter their name in the **Your Name** field on the Join Session page
