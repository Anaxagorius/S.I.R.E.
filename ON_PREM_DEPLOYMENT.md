# On-Premises Deployment Guide

## Overview

S.I.R.E. supports on-premises (self-hosted) deployment for organisations that
require data to remain entirely within their own infrastructure — for example,
government agencies, healthcare organisations, or other regulated environments.

All session data, user credentials, and analytics results are stored locally in
SQLite database files that never leave your server.

---

## Quick Start (Docker Compose)

**Prerequisites:**

- Docker ≥ 24.0
- Docker Compose ≥ 2.20

```bash
# 1. Clone the repository
git clone https://github.com/Anaxagorius/S.I.R.E.git
cd S.I.R.E.

# 2. (Optional) Create a .env file to customise settings
cp .env.example .env   # edit as needed

# 3. Build and start
docker compose up --build

# 4. Open the application
#    Frontend: http://localhost:5173
#    Backend API: http://localhost:8080
```

---

## Environment Variables

Create a `.env` file in the repository root to override defaults.

| Variable | Default | Description |
|---|---|---|
| `BACKEND_PORT` | `8080` | Host port mapped to the backend container |
| `FRONTEND_PORT` | `5173` | Host port mapped to the frontend container |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | CORS allowlist — set to your frontend URL |
| `VITE_API_BASE` | `http://localhost:8080` | Backend URL used by the browser |
| `VITE_SOCKET_URL` | `http://localhost:8080` | Socket.IO URL used by the browser |
| `API_KEY` | _(empty)_ | Optional API key for backend enforcement |
| `REQUIRE_API_KEY` | `false` | Set `true` to enforce `API_KEY` on all requests |
| `AUDIT_LOG_ENABLED` | `true` | Write structured audit events to stdout |
| `NODE_ENV` | `production` | Node environment flag |
| `DB_PATH` | `/data/users.db` | Path to the user authentication database |
| `SIRE_DB_PATH` | `/data/sire.db` | Path to the scenarios / analytics database |

---

## Data Residency

| Data category | Where stored | Leaves server? |
|---|---|---|
| User credentials (hashed) | `users.db` (SQLite) | **Never** |
| Scenario definitions | `sire.db` (SQLite) | **Never** |
| Session analytics | `sire.db` (SQLite) | **Never** |
| Live session state | In-memory (RAM) | **Never** |
| Audit log | `stdout` / container logs | Only if you ship logs externally |

**Passwords** are stored as SHA-256 hashes — plaintext passwords are never
persisted.  For production deployments, consider augmenting this with a proper
key-derivation function (e.g., bcrypt) in `authRoute.mjs`.

**No telemetry** is collected.  S.I.R.E. does not make any outbound network
requests on behalf of your organisation.

---

## Persistent Data

All databases are stored in the `sire-data` Docker named volume and survive
container restarts and upgrades.

To back up your data:

```bash
# Copy the SQLite files out of the named volume
docker run --rm \
  -v sire-data:/data \
  -v "$(pwd)/backup":/backup \
  alpine cp -r /data /backup/sire-data-$(date +%Y%m%d)
```

To restore:

```bash
docker run --rm \
  -v sire-data:/data \
  -v "$(pwd)/backup/sire-data-20260101":/restore \
  alpine cp -r /restore/. /data/
```

---

## Upgrading

```bash
git pull
docker compose up --build --force-recreate
```

The database schema is migrated automatically on startup — existing data is
preserved.

---

## Reverse Proxy (HTTPS)

For production deployments, place an nginx or Caddy reverse proxy in front of
the services and terminate TLS there.  A minimal nginx snippet:

```nginx
server {
    listen 443 ssl;
    server_name sire.example.com;

    # TLS configuration …

    location /api/ {
        proxy_pass         http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
    }

    location / {
        proxy_pass http://localhost:5173;
    }
}
```

Set `ALLOWED_ORIGINS=https://sire.example.com` and
`VITE_API_BASE=https://sire.example.com` in your `.env`.

---

## Role-Based Access Control

S.I.R.E. ships with three system roles:

| Role | Can create/edit scenarios | Can view analytics | Can run sessions | Can manage users |
|---|---|---|---|---|
| `admin` | ✅ | ✅ | ✅ | ✅ |
| `facilitator` | ✅ | ✅ | ✅ | ❌ |
| `participant` | ❌ | ❌ | Join only | ❌ |

All self-registrations create a `participant` account.  Promote users to
`admin` or `facilitator` via the **User Management** panel (Analytics screen,
admin-only) or via the API:

```bash
# Obtain an admin auth token first
TOKEN=$(curl -s -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret"}' \
  | jq -r .authToken)

# Promote a user to facilitator
curl -X PUT http://localhost:8080/api/users/<user-id>/role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"facilitator"}'
```

---

## Support

For questions or issues, open a GitHub issue at
[github.com/Anaxagorius/S.I.R.E.](https://github.com/Anaxagorius/S.I.R.E.).
