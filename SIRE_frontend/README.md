# S.I.R.E. Frontend

Real-time React-based user interface for the **S.I.R.E. (Simulator for Incident Response Exercises)** training platform.

## 🚀 Quick Start

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

## 🔄 Reloading & Updating Services

### Development Mode

You do **not** need to restart the frontend dev server when you edit source files.
Vite uses **Hot Module Replacement (HMR)** — the browser updates instantly on every save.

If you edit `.env` (e.g. change `VITE_API_BASE` or `VITE_API_KEY`), stop the dev
server (`Ctrl+C`) and restart it with `npm run dev` for the new values to take effect.

### Production (Render / Railway / Heroku)

`VITE_*` environment variables are **baked into the JavaScript bundle at build time**.
Changing them in the platform dashboard does **not** take effect until the frontend is
**rebuilt and redeployed**.

| Scenario | Action required |
|---|---|
| Frontend source code changed | Redeploy `sire-web` (auto on push if auto-deploy is on) |
| `VITE_API_BASE` or `VITE_API_KEY` changed | **Manually trigger a redeploy** of `sire-web` |
| Only backend changed | No frontend action needed |

> **Tip:** Always redeploy the **backend first**, confirm it is healthy, then redeploy
> the frontend so the Vite build uses the correct `VITE_API_KEY`.

## �� Features

### Landing Page
- Clean role selection interface
- Choose between **Instructor** or **Trainee** roles

### Instructor Dashboard
- **Session Management**
  - Create training sessions with scenario selection
  - Display and share session codes
  - End active sessions
  
- **Session Control**
  - Start/stop scenarios
  - View live participant roster
  - Monitor timeline progress
  
- **Admin Injection Panel**
  - Inject custom events with severity levels (info, warning, critical)
  - Real-time broadcast to all participants
  
- **Live Event Feed**
  - View all timeline events
  - Monitor trainee actions
  - Track admin injections
  - Auto-scrolling with color-coded events

### Trainee Interface
- **Session Join**
  - Enter session code to join
  - Provide display name
  
- **Scenario Display**
  - View current timeline event prominently
  - Access previous events
  - Track scenario progress
  
- **Action Logger**
  - Log actions taken during the exercise
  - Provide rationale (optional)
  - Instant feedback confirmation
  
- **Shared Event Feed**
  - Real-time view of all activities
  - See other trainees' actions
  - Highlighted admin injections
  - Color-coded event types

## 🧪 Testing with Backend

### Local Development Setup

1. **Start the Backend**
   ```bash
   cd ../SIRE_backend/backend
   npm run dev
   ```
   Backend runs on `http://localhost:8080`

2. **Start the Frontend**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

### Testing Workflow

1. **Create a Session (Instructor)**
   - Open `http://localhost:5173`
   - Click "Instructor"
   - Enter your name
   - Select a scenario (e.g., "Fire Emergency")
   - Click "Create Session"
   - Copy the generated session code

2. **Join Session (Trainee)**
   - Open `http://localhost:5173` in another browser/incognito
   - Click "Trainee"
   - Enter the session code
   - Enter your name
   - Click "Join Session"

3. **Start Scenario (Instructor)**
   - In the instructor view, click "Start Scenario"
   - Watch timeline events appear automatically

4. **Log Actions (Trainee)**
   - In the trainee view, see current event
   - Enter an action (e.g., "Called emergency services")
   - Add rationale (optional)
   - Click "Log Action"

5. **Admin Injection (Instructor)**
   - In the instructor view, use the "Admin Injection" panel
   - Type a custom message
   - Select severity (info/warning/critical)
   - Click "Inject Event"
   - See it appear in all participants' event feeds

## 📦 Available Scenarios

1. **Active Threat** - Security incident response
2. **Fire Emergency** - Fire detection and evacuation
3. **Flood** - Water damage and system protection
4. **Cyber Attack** - Ransomware and recovery
5. **Power Outage** - Facility power loss
6. **Severe Weather** - Storm impact management
7. **Medical Emergency** - Cardiac event response
8. **Hazardous Material Spill** - Chemical containment

## ☁️ Deploying to Render

The frontend deploys as a **Static Site** on Render under the service name **`sire-web`**.

### Quick Deploy (Blueprint)

The root `render.yaml` in the repository sets up both services automatically.

1. Go to [Render Dashboard](https://dashboard.render.com) → **New → Blueprint**.
2. Connect the `Anaxagorius/S.I.R.E.` repository.
3. Render detects the root `render.yaml` and creates both `sire-api` and `sire-web`.
4. Set the **`VITE_API_KEY`** environment variable for `sire-web` to the generated
   `API_KEY` value from the `sire-api` service (found in the Render dashboard after
   the first deploy).

### Manual Deploy

1. **New → Static Site** → connect repo → set **Root Directory** to `SIRE_frontend`.
2. **Build Command:** `npm ci && npm run build`
3. **Publish Directory:** `dist`
4. Add the following **Environment Variables** (build-time):

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE` | `https://sire-api.onrender.com/api` |
   | `VITE_API_KEY` | *(copy from `sire-api` API_KEY)* |

5. Add a **Rewrite Rule**: `/* → /index.html` (for client-side routing).

### Environment Variables

| Variable | Description | Default (local dev) |
|---|---|---|
| `VITE_API_BASE` | Backend base URL with `/api` path (no trailing slash) | `http://localhost:8080/api` |
| `VITE_API_KEY` | API key matching the backend `API_KEY` | `local-dev-key` |

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
# then edit .env as needed
```

## 🐛 Troubleshooting

### Frontend won't connect to backend
- Verify backend is running on port 8080
- Check browser console for connection errors
- Ensure CORS is enabled in backend
- On Render: confirm `VITE_API_BASE` points to `https://sire-api.onrender.com/api`

### Socket.IO not connecting
- Check that API key matches between frontend (`VITE_API_KEY`) and backend (`API_KEY`)
- Verify Socket.IO namespace is `/sim`
- Look for authentication errors in console

## 📄 License

Part of the S.I.R.E. project.
