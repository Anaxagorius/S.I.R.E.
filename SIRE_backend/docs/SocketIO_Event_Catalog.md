
# Socket.IO Event Catalog & Protocol

## Namespaces & Rooms
- Namespace: `/sim`  
- Room: `session:{sessionCode}` — each live simulation session

## Events (Server ⇄ Client)
- `session:create` (server→admin): confirms creation with `sessionCode` and `scenarioKey`.
- `session:join` (client→server): trainee joins with `{ sessionCode, displayName }`.
- `session:joined` (server→client): acknowledges join; returns roster and current timeline index.
- `session:start` (admin→server): starts scenario timeline.
- `timeline:tick` (server→room): emits each timed escalation `{ index, title, description, timeOffsetSec }`.
- `admin:inject` (admin→server): inject an unscheduled event `{ message, severity }`.
- `event:log` (client→server): trainee action log `{ action, rationale }`.
- `event:log:broadcast` (server→room): rebroadcast of trainee/admin log to all participants.
- `session:end` (server→room): indicates scenario completed or failed.

## Error Semantics
- All errors use `error:occurred` with `{ code, message, correlationId }`.

## Payload Contracts (TypeScript‑style)
```ts
interface TimelineEvent { index: number; title: string; description: string; timeOffsetSec: number; }
interface AdminInjection { message: string; severity: 'info'|'warning'|'critical'; }
interface ActionLog { actorRole: 'admin'|'trainee'; displayName: string; action: string; rationale?: string; timestampIso: string; }
```
