
# Incident Response Simulator — Pro Package

This package contains group‑focused documentation and backend code artifacts aligned to Tom Burchell’s responsibilities: backend architecture, Express + Socket.IO core, scenario escalation engine, and deployment pipeline.

## Contents
- `docs/Project_Charter.md` — group charter
- `docs/Kickoff_Meeting_Agenda.md` — meeting template
- `docs/API_Specification.yaml` — OpenAPI spec
- `docs/SocketIO_Event_Catalog.md` — event semantics
- `docs/Deployment_Guide.md` — environment, docker, CI
- `docs/ADR-001_Stack_Selection.md` — rationale
- `docs/Gantt_Detailed.csv` — schedule with dependencies
- `docs/Gantt_Detailed.png` — visual Gantt
- `backend/` — runnable Express + Socket.IO server with escalation engine
- `.github/workflows/ci.yml` — Node CI pipeline

## Quick Start (Backend)
```bash
cd backend
npm install
npm run dev
```

Then use a Socket.IO client to connect to namespace `/sim` and test events.
