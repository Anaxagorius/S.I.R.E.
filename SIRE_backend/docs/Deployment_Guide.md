
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

## ⚠️ Limitations & Caveats

### In-Memory Session Storage

**IMPORTANT:** The S.I.R.E. backend currently uses **in-memory session storage only**. This architectural decision has the following implications:

- ✅ **Suitable for:** Demo, development, academic training exercises, and short-lived sessions
- ❌ **Not suitable for:** Production environments requiring session persistence across restarts

#### Key Limitations:

1. **Session Volatility**: All session data is stored in RAM and will be **completely lost** on:
   - Application restart
   - Server reboot
   - Container redeployment
   - Application crash or forced termination

2. **No Persistence**: Session state, trainee progress, and scenario history are **not saved to disk**

3. **Single-Instance Only**: Sessions cannot be shared across multiple backend instances (no horizontal scaling)

#### Future Improvements:

For production deployments requiring persistent session storage, consider:

- **Database Integration**: PostgreSQL, MongoDB, or similar for durable session persistence
- **Redis/Memcached**: Distributed in-memory caching with persistence and replication
- **Session Middleware**: Express-session with persistent store adapters
- **State Management**: External state management system with backup/restore capabilities

#### Current Use Case:

The in-memory approach is intentional for the current **demo and academic training use case**, where:
- Training sessions are short-lived (minutes to hours)
- Instructors can easily restart sessions if needed
- Simplicity and zero external dependencies are prioritized

For any production deployment or long-running training programs, implementing persistent storage is **strongly recommended**.
