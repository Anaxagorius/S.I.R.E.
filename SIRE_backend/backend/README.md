
# 🚨 SIRE — Backend

This backend powers the **SIRE**, providing:

- A REST API for health checks and session management  
- A Socket.IO server for real-time simulation events  
- In-memory session storage  
- Scenario-driven incident drill progression  

Built with **Node.js**, **Express**, and **Socket.IO** using modern **ESM (`.mjs`) modules**.

📚 **[Full Deployment Guide](../docs/Deployment_Guide.md)** — Local, Docker, and Cloud deployment instructions

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

# 📋 Enhanced Scenarios

The backend includes **8 comprehensive incident response scenarios**, each with **5-7 escalation events** designed for realistic training exercises.

## Available Scenarios

### 1. **Active Threat** (`scenario_active_threat.json`)
Progressive escalation from initial suspicious behavior to law enforcement resolution.
- **Events**: 7 stages over ~5 minutes
- **Key Decision Points**: Lockdown initiation, personnel accountability, law enforcement coordination

### 2. **Fire Emergency** (`scenario_fire.json`)
Fire detection through evacuation and emergency response.
- **Events**: 6 stages over ~4 minutes
- **Key Decision Points**: Evacuation timing, sprinkler system management, fire department coordination

### 3. **Flood** (`scenario_flood.json`)
Water intrusion escalation with electrical hazards and system protection.
- **Events**: 6 stages over ~4.5 minutes
- **Key Decision Points**: Power shutdown, critical asset relocation, damage assessment

### 4. **Cyber Attack** (`scenario_cyber_attack.json`)
Phishing attack through ransomware to recovery.
- **Events**: 7 stages over ~5 minutes
- **Key Decision Points**: System isolation, backup verification, incident response activation

### 5. **Power Outage** (`scenario_power_outage.json`)
Facility-wide power loss with generator backup and restoration.
- **Events**: 6 stages over ~4.5 minutes
- **Key Decision Points**: Load prioritization, generator management, grid restoration

### 6. **Severe Weather** (`scenario_severe_weather.json`)
Storm warning through impact and damage assessment.
- **Events**: 6 stages over ~5 minutes
- **Key Decision Points**: Personnel safety, building security, shelter-in-place protocols

### 7. **Medical Emergency** (`scenario_medical_emergency.json`)
Cardiac event response from collapse through EMS transport.
- **Events**: 6 stages over ~4 minutes
- **Key Decision Points**: First aid response, AED deployment, EMS coordination

### 8. **Hazardous Material Spill** (`scenario_hazardous_material_spill.json`)
Chemical spill containment and decontamination.
- **Events**: 6 stages over ~5 minutes
- **Key Decision Points**: Area evacuation, ventilation control, hazmat team coordination

## Scenario Design Approach

Each enhanced scenario follows emergency management best practices:

- **Progressive Escalation**: Events build in severity and complexity
- **Realistic Timelines**: Time intervals range from 5 seconds to 5 minutes based on incident type
- **Decision Points**: Each event requires trainee assessment and action
- **Complete Lifecycle**: From detection through resolution and recovery

## Testing Enhanced Scenarios

To test a scenario with the enhanced timeline:

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Create a session** via REST API and **start a scenario** via Socket.IO

3. **Observe event progression** - events will fire based on `timeOffsetSec` values

4. **Validate event sequence** - ensure each event index, title, and description displays correctly

Each scenario completes in 2-5 minutes, making them suitable for training sessions while maintaining realistic pacing.

---

# 🏁 Status

✔ Backend functional  
✔ REST + Socket.IO operational  
✔ Sessions + scenarios supported  
✔ ESM conversion complete  
✔ 8 enhanced scenarios with realistic escalation timelines  
