
# Incident Response Simulator — Pro Package

This package contains group‑focused documentation and backend code artifacts aligned to Tom Burchell’s responsibilities: backend architecture, Express + Socket.IO core, scenario escalation engine, and deployment pipeline.

## Contents
- `docs/Project_Charter.md` — group charter
- `docs/Kickoff_Meeting_Agenda.md` — meeting template
- `docs/API_Specification.yaml` — OpenAPI spec
- `docs/SocketIO_Event_Catalog.md` — event semantics
- `docs/Deployment_Guide.md` — comprehensive deployment guide (local, Docker, cloud)
- `docs/Cloud_Deployment_Quickstart.md` — quick cloud deployment reference
- `docs/ADR-001_Stack_Selection.md` — rationale
- `docs/Gantt_Detailed.csv` — schedule with dependencies
- `docs/Gantt_Detailed.png` — visual Gantt
- `backend/` — runnable Express + Socket.IO server with escalation engine
- `.github/workflows/ci.yml` — Node CI pipeline

## Quick Start (Backend)

### Local Development
```bash
cd backend
npm install
API_KEY=local-dev-key npm run dev
```

Then use a Socket.IO client to connect to namespace `/sim` and test events.

### Cloud Deployment

Deploy to a free-tier cloud provider:
- **Railway**: Use `backend/railway.json` configuration
- **Render**: Use `backend/render.yaml` blueprint
- **Heroku**: Use `backend/Procfile` and `backend/app.json`

See [Deployment Guide](docs/Deployment_Guide.md) for detailed instructions.
