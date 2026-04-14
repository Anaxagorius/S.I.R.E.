// socketServer.mjs
import { createRequire } from 'module';
import { sessionService } from '../services/sessionService.mjs';
import { scenarioRegistry } from '../services/scenarioRegistry.mjs';
import { escalationService } from '../services/escalationService.mjs';
import { inMemorySessionStore } from '../models/inMemorySessionStore.mjs';
import { sireDatabase } from '../models/sireDatabase.mjs';
import { securityConfig } from '../config/securityConfig.mjs';
import { environmentConfig } from '../config/environmentConfig.mjs';
import { auditLogger } from '../config/auditLogger.mjs';
import { buildAuditContext } from '../utils/auditContext.mjs';
import {
  generateRandomUuid,
  normalizeActionText,
  normalizeDisplayName,
  normalizeMessageText,
  normalizeRationaleText,
  normalizeRole,
  normalizeSessionCode,
  normalizeSeverity,
  normalizeInjectId,
  normalizeActionItemText,
} from '../utils/validation.mjs';

const require = createRequire(import.meta.url);
const { Server } = require('socket.io');

const emitError = (socket, code, message) => {
  socket.emit('error:occurred', {
    code,
    message,
    correlationId: generateRandomUuid()
  });
};

/**
 * Compute analytics KPIs from a completed session record and persist to the database.
 * Safe to call multiple times — duplicate records are acceptable for audit purposes.
 */
function persistSessionResult(session, logger) {
  try {
    const eventLog = session.eventLog || [];
    const traineeEvents = eventLog.filter(e => e.actorRole === 'trainee');

    const decisionTimes = traineeEvents
      .filter(e => typeof e.decisionTimeMs === 'number')
      .map(e => e.decisionTimeMs);
    const avgTimeToDecisionMs = decisionTimes.length > 0
      ? Math.round(decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length)
      : null;

    const activeTrainees = new Set(traineeEvents.map(e => e.displayName)).size;
    const participationRate = session.trainees.length > 0
      ? activeTrainees / session.trainees.length
      : 0;

    const decisionsWithOutcome = traineeEvents.filter(e => typeof e.isCorrect === 'boolean');
    const correctCount = decisionsWithOutcome.filter(e => e.isCorrect).length;
    const overallAccuracy = decisionsWithOutcome.length > 0
      ? correctCount / decisionsWithOutcome.length
      : null;

    const milestonesCompleted = Math.max(0, session.currentTimelineIndex + 1);

    // Per-role breakdown
    const roleMap = {};
    for (const t of session.trainees) {
      if (t.role && !roleMap[t.role]) {
        roleMap[t.role] = { accuracySum: 0, accuracyCount: 0, timeSum: 0, timeCount: 0 };
      }
    }
    for (const evt of traineeEvents) {
      if (evt.role && roleMap[evt.role]) {
        if (typeof evt.isCorrect === 'boolean') {
          roleMap[evt.role].accuracyCount++;
          if (evt.isCorrect) roleMap[evt.role].accuracySum++;
        }
        if (typeof evt.decisionTimeMs === 'number') {
          roleMap[evt.role].timeSum += evt.decisionTimeMs;
          roleMap[evt.role].timeCount++;
        }
      }
    }
    const roleBreakdown = {};
    for (const [role, data] of Object.entries(roleMap)) {
      roleBreakdown[role] = {
        accuracy: data.accuracyCount > 0 ? data.accuracySum / data.accuracyCount : null,
        avgDecisionTimeMs: data.timeCount > 0 ? Math.round(data.timeSum / data.timeCount) : null,
      };
    }

    // Per-trainee summary for the detailed JSON
    const participants = session.trainees.map(t => {
      const myEvents = traineeEvents.filter(e => e.displayName === t.displayName);
      const myDecisions = myEvents.filter(e => typeof e.isCorrect === 'boolean');
      const myCorrect = myDecisions.filter(e => e.isCorrect).length;
      const myTimes = myEvents.filter(e => typeof e.decisionTimeMs === 'number').map(e => e.decisionTimeMs);
      return {
        displayName: t.displayName,
        role: t.role || null,
        score: myEvents.length > 0 ? myEvents[myEvents.length - 1].score ?? 0 : 0,
        decisions: myDecisions.length,
        correctDecisions: myCorrect,
        avgDecisionTimeMs: myTimes.length > 0
          ? Math.round(myTimes.reduce((a, b) => a + b, 0) / myTimes.length)
          : null,
      };
    });

    const kpis = {
      avgTimeToDecisionMs,
      participationRate,
      overallAccuracy,
      milestonesCompleted,
      roleBreakdown,
      participants,
    };

    const endedAt = new Date().toISOString();
    const startedAt = session.startedAtMs ? new Date(session.startedAtMs).toISOString() : null;

    sireDatabase.saveSessionResult({
      sessionCode: session.sessionCode,
      scenarioKey: session.scenarioKey,
      startedAt,
      endedAt,
      participantCount: session.trainees.length,
      kpis,
    });

    if (logger) {
      logger.info('Session result persisted', { sessionCode: session.sessionCode });
    }
  } catch (err) {
    if (logger) {
      logger.warn('Failed to persist session result', { sessionCode: session.sessionCode, error: String(err) });
    }
  }
}

/**
 * Normalize allowed origins from env/config:
 * - supports array input
 * - supports comma-separated string input
 * - trims whitespace
 */
const normalizeAllowedOrigins = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
};

export function attachSocketServer(httpServer, logger) {
  const allowedOrigins = normalizeAllowedOrigins(environmentConfig.allowedOrigins);
  const allowAllOrigins = allowedOrigins.includes('*');

  /**
   * Socket.IO CORS applies to the HTTP long-polling handshake (and pre-upgrade requests).
   * Use a function so we can accurately match the requesting Origin header. [1](https://socket.io/docs/v4/handling-cors/)[2](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
   *
   * Also: credentials cannot be used with Access-Control-Allow-Origin: '*' in browsers. [4](https://socket.io/fr/docs/v4/handling-cors/)[5](https://www.xjavascript.com/blog/cors-credentials-mode-is-include/)
   */
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // allow non-browser clients (no Origin header)
        if (!origin) return callback(null, true);

        if (allowAllOrigins) return callback(null, true);

        if (allowedOrigins.includes(origin)) return callback(null, true);

        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      methods: ['GET', 'POST'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'x-api-key',
        'x-ticket-id',
        'x-request-id'
      ],
      credentials: !allowAllOrigins
    }
  });

  const simNamespace = io.of('/sim');

  simNamespace.use((socket, next) => {
    if (!securityConfig.requireApiKey) {
      socket.data.auth = { actor: 'anonymous', scope: 'socket' };
      return next();
    }

    // Prefer the browser-safe auth payload; fall back to header for
    // backward compatibility with non-browser clients and existing tests.
    const fromAuth = socket.handshake.auth?.apiKey;
    const fromHeader = socket.handshake.headers?.[securityConfig.socketHandshakeHeader];
    const raw = fromAuth !== undefined ? fromAuth : fromHeader;
    const candidate = Array.isArray(raw) ? raw[0] : raw;

    if (securityConfig.apiKey && String(candidate || '') === securityConfig.apiKey) {
      socket.data.auth = { actor: 'api-key', scope: 'socket' };
      return next();
    }

    auditLogger.event({
      action: 'socket:auth:failure',
      actor: 'unknown',
      context: buildAuditContext({ socketId: socket.id }, ['socketId']),
      outcome: 'denied',
      correlationId: generateRandomUuid()
    });

    return next(new Error('UNAUTHORIZED'));
  });

  simNamespace.on('connection', socket => {
    const actor = socket.data?.auth?.actor || 'unknown';

    logger.info('Client connected', { id: socket.id });
    auditLogger.event({
      action: 'socket:connected',
      actor,
      context: buildAuditContext({ socketId: socket.id }, ['socketId']),
      outcome: 'success',
      correlationId: generateRandomUuid()
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected', { id: socket.id });
      auditLogger.event({
        action: 'socket:disconnected',
        actor,
        context: buildAuditContext({ socketId: socket.id }, ['socketId']),
        outcome: 'success',
        correlationId: generateRandomUuid()
      });
    });

    socket.on('session:join', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      const displayName = normalizeDisplayName(payload?.displayName);
      const role = normalizeRole(payload?.role);

      if (!sessionCode || !displayName) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode and displayName are required');
        return;
      }

      try {
        const record = sessionService.joinSession({
          sessionCode,
          socketId: socket.id,
          displayName,
          role
        });

        const room = `session:${sessionCode}`;
        socket.join(room);

        // Store role on socket so role-filtered injects can match it later
        if (role) socket.data.participantRole = role;

        socket.emit('session:joined', {
          sessionCode,
          roster: record.trainees,
          currentTimelineIndex: record.currentTimelineIndex,
          isPaused: record.isPaused,
          injectQueue: record.injectQueue,
          actionItems: record.actionItems,
        });

        socket.to(room).emit('session:joined', {
          sessionCode,
          roster: record.trainees,
          currentTimelineIndex: record.currentTimelineIndex,
          isPaused: record.isPaused,
          injectQueue: record.injectQueue,
          actionItems: record.actionItems,
        });

        simNamespace.to(room).emit('event:log:broadcast', {
          actorRole: 'trainee',
          displayName,
          action: 'joined session',
          timestampIso: new Date().toISOString()
        });

        auditLogger.event({
          action: 'session:join',
          actor,
          context: buildAuditContext(
            { sessionCode, displayName, socketId: socket.id },
            ['sessionCode', 'displayName', 'socketId']
          ),
          outcome: 'success',
          correlationId: generateRandomUuid()
        });
      } catch (err) {
        const code = String(err.message || err);

        auditLogger.event({
          action: 'session:join',
          actor,
          context: buildAuditContext(
            { sessionCode, displayName, socketId: socket.id },
            ['sessionCode', 'displayName', 'socketId']
          ),
          outcome: 'error',
          correlationId: generateRandomUuid()
        });

        emitError(socket, code, 'Unable to join session');
      }
    });

    socket.on('admin:join', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      if (!sessionCode) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode is required');
        return;
      }

      const session = inMemorySessionStore.getSession(sessionCode);
      if (!session) {
        emitError(socket, 'SESSION_NOT_FOUND', 'Session not found');
        return;
      }

      const room = `session:${sessionCode}`;
      socket.join(room);

      socket.emit('session:joined', {
        sessionCode,
        roster: session.trainees,
        currentTimelineIndex: session.currentTimelineIndex,
        isPaused: session.isPaused,
        injectQueue: session.injectQueue,
        actionItems: session.actionItems,
      });

      auditLogger.event({
        action: 'admin:join',
        actor,
        context: buildAuditContext({ sessionCode, socketId: socket.id }, ['sessionCode', 'socketId']),
        outcome: 'success',
        correlationId: generateRandomUuid()
      });
    });

    socket.on('session:start', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      if (!sessionCode) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode is required');
        return;
      }

      const session = inMemorySessionStore.getSession(sessionCode);
      if (!session) {
        emitError(socket, 'SESSION_NOT_FOUND', 'Session not found');
        return;
      }

      const scenarioDefinition = scenarioRegistry.getScenarioByKey(session.scenarioKey);
      if (!scenarioDefinition) {
        emitError(socket, 'SCENARIO_NOT_FOUND', 'Scenario not found');
        return;
      }

      const room = `session:${sessionCode}`;
      socket.join(room);

      escalationService.startTimeline({
        io,
        sessionCode,
        scenarioDefinition,
        onEnd: (code) => {
          const session = inMemorySessionStore.getSession(code);
          if (session) persistSessionResult(session, logger);
        },
      });
      inMemorySessionStore.markStarted(sessionCode);

      auditLogger.event({
        action: 'session:start',
        actor,
        context: buildAuditContext(
          { sessionCode, scenarioKey: session.scenarioKey, socketId: socket.id },
          ['sessionCode', 'scenarioKey', 'socketId']
        ),
        outcome: 'success',
        correlationId: generateRandomUuid()
      });
    });

    socket.on('admin:inject', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      const message = normalizeMessageText(payload?.message);
      const severity = normalizeSeverity(payload?.severity);

      if (!sessionCode || !message || !severity) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode, message, severity are required');
        return;
      }

      const session = inMemorySessionStore.getSession(sessionCode);
      if (!session) {
        emitError(socket, 'SESSION_NOT_FOUND', 'Session not found');

        auditLogger.event({
          action: 'admin:inject',
          actor,
          context: buildAuditContext({ sessionCode, error: 'SESSION_NOT_FOUND' }, ['sessionCode', 'error']),
          outcome: 'denied',
          correlationId: generateRandomUuid()
        });

        return;
      }

      const room = `session:${sessionCode}`;
      simNamespace.to(room).emit('event:log:broadcast', {
        actorRole: 'admin',
        displayName: 'Instructor',
        action: message,
        rationale: severity,
        timestampIso: new Date().toISOString()
      });

      auditLogger.event({
        action: 'admin:inject',
        actor,
        context: buildAuditContext({ sessionCode, severity, socketId: socket.id }, ['sessionCode', 'severity', 'socketId']),
        outcome: 'success',
        correlationId: generateRandomUuid()
      });
    });

    socket.on('session:pause', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      if (!sessionCode) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode is required');
        return;
      }

      const session = inMemorySessionStore.getSession(sessionCode);
      if (!session) {
        emitError(socket, 'SESSION_NOT_FOUND', 'Session not found');
        return;
      }

      if (session.isPaused) {
        emitError(socket, 'ALREADY_PAUSED', 'Session is already paused');
        return;
      }

      escalationService.pauseTimeline({ sessionCode });

      const room = `session:${sessionCode}`;
      simNamespace.to(room).emit('session:paused', { sessionCode, pausedAt: new Date().toISOString() });

      auditLogger.event({
        action: 'session:pause',
        actor,
        context: buildAuditContext({ sessionCode, socketId: socket.id }, ['sessionCode', 'socketId']),
        outcome: 'success',
        correlationId: generateRandomUuid()
      });
    });

    socket.on('session:resume', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      if (!sessionCode) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode is required');
        return;
      }

      const session = inMemorySessionStore.getSession(sessionCode);
      if (!session) {
        emitError(socket, 'SESSION_NOT_FOUND', 'Session not found');
        return;
      }

      if (!session.isPaused) {
        emitError(socket, 'NOT_PAUSED', 'Session is not paused');
        return;
      }

      escalationService.resumeTimeline({ sessionCode });

      const room = `session:${sessionCode}`;
      simNamespace.to(room).emit('session:resumed', { sessionCode, resumedAt: new Date().toISOString() });

      auditLogger.event({
        action: 'session:resume',
        actor,
        context: buildAuditContext({ sessionCode, socketId: socket.id }, ['sessionCode', 'socketId']),
        outcome: 'success',
        correlationId: generateRandomUuid()
      });
    });

    socket.on('admin:inject:queue:add', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      const message = normalizeMessageText(payload?.message);
      const severity = normalizeSeverity(payload?.severity) || 'info';
      const roleFilter = normalizeRole(payload?.roleFilter);

      if (!sessionCode || !message) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode and message are required');
        return;
      }

      const session = inMemorySessionStore.getSession(sessionCode);
      if (!session) {
        emitError(socket, 'SESSION_NOT_FOUND', 'Session not found');
        return;
      }

      const inject = inMemorySessionStore.addInjectToQueue(sessionCode, { message, severity, roleFilter });

      const room = `session:${sessionCode}`;
      // Broadcast updated queue to admin (same room)
      simNamespace.to(room).emit('inject:queue:updated', {
        sessionCode,
        injectQueue: inMemorySessionStore.getInjectQueue(sessionCode),
      });

      auditLogger.event({
        action: 'admin:inject:queue:add',
        actor,
        context: buildAuditContext({ sessionCode, injectId: inject.id, socketId: socket.id }, ['sessionCode', 'injectId', 'socketId']),
        outcome: 'success',
        correlationId: generateRandomUuid()
      });
    });

    socket.on('admin:inject:release', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      const injectId = normalizeInjectId(payload?.injectId);

      if (!sessionCode || !injectId) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode and injectId are required');
        return;
      }

      const session = inMemorySessionStore.getSession(sessionCode);
      if (!session) {
        emitError(socket, 'SESSION_NOT_FOUND', 'Session not found');
        return;
      }

      const inject = inMemorySessionStore.releaseInject(sessionCode, injectId);
      if (!inject) {
        emitError(socket, 'INJECT_NOT_FOUND', 'Inject not found or already released');
        return;
      }

      const room = `session:${sessionCode}`;

      // Broadcast to participants (filtered by role if roleFilter is set)
      const eventPayload = {
        actorRole: 'admin',
        displayName: 'Instructor',
        action: inject.message,
        rationale: inject.severity,
        roleFilter: inject.roleFilter,
        timestampIso: inject.releasedAt,
      };

      if (inject.roleFilter) {
        // Only broadcast to participants whose role matches
        const matchingSockets = Array.from(simNamespace.sockets.values()).filter(s => {
          return s.rooms.has(room) && s.data?.participantRole === inject.roleFilter;
        });
        matchingSockets.forEach(s => s.emit('event:log:broadcast', eventPayload));

        // Always send to admin sockets (those in the room without a participant role)
        const adminSockets = Array.from(simNamespace.sockets.values()).filter(s => {
          return s.rooms.has(room) && !s.data?.participantRole;
        });
        adminSockets.forEach(s => s.emit('event:log:broadcast', eventPayload));
      } else {
        simNamespace.to(room).emit('event:log:broadcast', eventPayload);
      }

      // Notify admin of updated queue state
      simNamespace.to(room).emit('inject:queue:updated', {
        sessionCode,
        injectQueue: inMemorySessionStore.getInjectQueue(sessionCode),
      });

      auditLogger.event({
        action: 'admin:inject:release',
        actor,
        context: buildAuditContext({ sessionCode, injectId, socketId: socket.id }, ['sessionCode', 'injectId', 'socketId']),
        outcome: 'success',
        correlationId: generateRandomUuid()
      });
    });

    socket.on('admin:inject:edit', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      const injectId = normalizeInjectId(payload?.injectId);
      const message = normalizeMessageText(payload?.message);
      const severity = normalizeSeverity(payload?.severity);
      const roleFilter = payload?.roleFilter !== undefined ? (normalizeRole(payload.roleFilter) || null) : undefined;

      if (!sessionCode || !injectId || !message) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode, injectId, and message are required');
        return;
      }

      const session = inMemorySessionStore.getSession(sessionCode);
      if (!session) {
        emitError(socket, 'SESSION_NOT_FOUND', 'Session not found');
        return;
      }

      const inject = inMemorySessionStore.editInject(sessionCode, injectId, { message, severity, roleFilter });
      if (!inject) {
        emitError(socket, 'INJECT_NOT_FOUND', 'Inject not found or already released');
        return;
      }

      const room = `session:${sessionCode}`;
      simNamespace.to(room).emit('inject:queue:updated', {
        sessionCode,
        injectQueue: inMemorySessionStore.getInjectQueue(sessionCode),
      });

      auditLogger.event({
        action: 'admin:inject:edit',
        actor,
        context: buildAuditContext(
          { sessionCode, injectId, hadOriginal: inject.originalMessage !== null, socketId: socket.id },
          ['sessionCode', 'injectId', 'hadOriginal', 'socketId']
        ),
        outcome: 'success',
        correlationId: generateRandomUuid()
      });
    });

    socket.on('admin:role:assign', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      const displayName = normalizeDisplayName(payload?.displayName);
      const role = normalizeRole(payload?.role);

      if (!sessionCode || !displayName || !role) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode, displayName, and role are required');
        return;
      }

      const session = inMemorySessionStore.getSession(sessionCode);
      if (!session) {
        emitError(socket, 'SESSION_NOT_FOUND', 'Session not found');
        return;
      }

      const trainee = inMemorySessionStore.assignTraineeRole(sessionCode, displayName, role);
      if (!trainee) {
        emitError(socket, 'TRAINEE_NOT_FOUND', 'Trainee not found in session');
        return;
      }

      const room = `session:${sessionCode}`;
      simNamespace.to(room).emit('session:roster:updated', {
        sessionCode,
        roster: inMemorySessionStore.getSession(sessionCode).trainees,
      });

      auditLogger.event({
        action: 'admin:role:assign',
        actor,
        context: buildAuditContext({ sessionCode, displayName, role, socketId: socket.id }, ['sessionCode', 'displayName', 'role', 'socketId']),
        outcome: 'success',
        correlationId: generateRandomUuid()
      });
    });

    socket.on('session:action:capture', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      const text = normalizeActionItemText(payload?.text);
      const capturedBy = normalizeDisplayName(payload?.capturedBy);
      const role = normalizeRole(payload?.role);
      const assignedTo = normalizeRole(payload?.assignedTo);

      if (!sessionCode || !text || !capturedBy) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode, text, and capturedBy are required');
        return;
      }

      const session = inMemorySessionStore.getSession(sessionCode);
      if (!session) {
        emitError(socket, 'SESSION_NOT_FOUND', 'Session not found');
        return;
      }

      const room = `session:${sessionCode}`;
      if (!socket.rooms.has(room)) {
        emitError(socket, 'FORBIDDEN', 'You are not part of this session');
        return;
      }

      const item = inMemorySessionStore.captureActionItem(sessionCode, { text, capturedBy, role, assignedTo });

      simNamespace.to(room).emit('action:item:broadcast', {
        sessionCode,
        item,
      });

      auditLogger.event({
        action: 'session:action:capture',
        actor,
        context: buildAuditContext({ sessionCode, capturedBy, socketId: socket.id }, ['sessionCode', 'capturedBy', 'socketId']),
        outcome: 'success',
        correlationId: generateRandomUuid()
      });
    });

    socket.on('event:log', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      const action = normalizeActionText(payload?.action);
      const rationale = normalizeRationaleText(payload?.rationale);
      const displayName = normalizeDisplayName(payload?.displayName);
      const role = normalizeRole(payload?.role);
      const score = typeof payload?.score === 'number' ? payload.score : undefined;
      const isCorrect = typeof payload?.isCorrect === 'boolean' ? payload.isCorrect : undefined;
      const decisionTimeMs = typeof payload?.decisionTimeMs === 'number' && payload.decisionTimeMs >= 0
        ? payload.decisionTimeMs
        : undefined;

      if (!sessionCode || !action || !displayName) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode, action, displayName are required');
        return;
      }

      const session = inMemorySessionStore.getSession(sessionCode);
      if (!session) {
        emitError(socket, 'SESSION_NOT_FOUND', 'Session not found');

        auditLogger.event({
          action: 'event:log',
          actor,
          context: buildAuditContext({ sessionCode, error: 'SESSION_NOT_FOUND' }, ['sessionCode', 'error']),
          outcome: 'denied',
          correlationId: generateRandomUuid()
        });

        return;
      }

      const room = `session:${sessionCode}`;
      if (!socket.rooms.has(room)) {
        emitError(socket, 'FORBIDDEN', 'You are not part of this session');

        auditLogger.event({
          action: 'event:log',
          actor,
          context: buildAuditContext(
            { sessionCode, displayName, error: 'not_in_room' },
            ['sessionCode', 'displayName', 'error']
          ),
          outcome: 'denied',
          correlationId: generateRandomUuid()
        });

        return;
      }

      const timestampIso = new Date().toISOString();

      // Store event in the session's analytics log
      inMemorySessionStore.logEvent(sessionCode, {
        actorRole: 'trainee',
        displayName,
        role: role || null,
        action,
        score: score !== undefined ? score : null,
        isCorrect: isCorrect !== undefined ? isCorrect : null,
        decisionTimeMs: decisionTimeMs !== undefined ? decisionTimeMs : null,
        timestampIso,
      });

      simNamespace.to(room).emit('event:log:broadcast', {
        actorRole: 'trainee',
        displayName,
        role: role || null,
        action,
        rationale,
        score: score !== undefined ? score : undefined,
        isCorrect: isCorrect !== undefined ? isCorrect : undefined,
        timestampIso,
      });

      auditLogger.event({
        action: 'event:log',
        actor,
        context: buildAuditContext({ sessionCode, displayName, socketId: socket.id }, ['sessionCode', 'displayName', 'socketId']),
        outcome: 'success',
        correlationId: generateRandomUuid()
      });
    });

    socket.on('session:end:admin', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      if (!sessionCode) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode is required');
        return;
      }

      const session = inMemorySessionStore.getSession(sessionCode);
      if (!session) {
        emitError(socket, 'SESSION_NOT_FOUND', 'Session not found');
        return;
      }

      // Persist analytics before marking session inactive
      persistSessionResult(session, logger);
      inMemorySessionStore.setActive(sessionCode, false);

      const room = `session:${sessionCode}`;
      simNamespace.to(room).emit('session:end', { sessionCode });

      auditLogger.event({
        action: 'session:end:admin',
        actor,
        context: buildAuditContext({ sessionCode, socketId: socket.id }, ['sessionCode', 'socketId']),
        outcome: 'success',
        correlationId: generateRandomUuid()
      });
    });
  });

  logger.info('Socket.IO server initialized', { allowedOrigins, allowAllOrigins });
  return io;
}
