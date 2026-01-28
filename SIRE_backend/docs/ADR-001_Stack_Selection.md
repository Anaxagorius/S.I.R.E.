
# ADR-001: Full‑Stack JavaScript with Socket.IO

- **Context:** Need real‑time, low‑latency bidirectional messaging with simple developer ergonomics.  
- **Decision:** Node.js + Express for REST; Socket.IO for rooms/retry; React for UI.  
- **Consequences:** Single‑language stack simplifies onboarding; WebSocket fallback handled by Socket.IO; horizontal scaling via Redis adapter when needed.
