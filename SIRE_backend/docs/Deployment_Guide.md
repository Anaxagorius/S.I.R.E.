
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

## Production Hardening Checklist
- Health check endpoint, structured logs, graceful shutdown, pinned deps, minimal base image.
