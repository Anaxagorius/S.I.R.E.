
# 🚨 SIRE — Backend

This backend powers the **SIRE**, providing:

- A REST API for health checks and session management  
- A Socket.IO server for real-time simulation events  
- In-memory session storage  
- Scenario-driven incident drill progression  

Built with **Node.js**, **Express**, and **Socket.IO** using modern **ESM (`.mjs`) modules**.

---

# 🚀 Quick Start

```
npm install
npm run dev
```

The server will start on the configured port (default: `8080`) and hot‑reload on file changes.

Set an API key before calling the API:

```
API_KEY=local-dev-key npm run dev
```

---

# 📁 Project Structure

```
src/
  server.mjs               # Application entrypoint (Express + Socket.IO)
  config/
    environmentConfig.mjs  # Port + environment settings
    logger.mjs             # Application logger
  routes/
    healthRoute.mjs        # /api/health
    sessionRoute.mjs       # /api/session CRUD
  sockets/
    socketServer.mjs       # Socket.IO setup and real-time events
  services/
    sessionService.mjs     # Business logic for sessions
  models/
    sessionModel.mjs       # In-memory session store
  scenarios/
    *.json                 # Incident drill scenario definitions
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
const socket = io("http://localhost:8080", { transports: ["websocket"] });
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

- Node.js 25+
- Express (REST)
- Socket.IO (real-time)
- ESM / .mjs modules
- In-memory data models

---

# 🔐 Security & Compliance Defaults

- REST requests require `x-api-key` (set `API_KEY` env var).
- Mutations require `x-ticket-id` for change tracking.
- Socket.IO connections require the same API key header.
- Set `REQUIRE_API_KEY=false` or `REQUIRE_TICKET_ID=false` only for local development.

---

# 🏁 Status

✔ Backend functional  
✔ REST + Socket.IO operational  
✔ Sessions + scenarios supported  
✔ ESM conversion complete  
