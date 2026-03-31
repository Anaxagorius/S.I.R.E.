// socketServer.mjs
import { createRequire } from 'module';
import { sessionService } from '../services/sessionService.mjs';
import { scenarioRegistry } from '../services/scenarioRegistry.mjs';
import { escalationService } from '../services/escalationService.mjs';
import { inMemorySessionStore } from '../models/inMemorySessionStore.mjs';
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
  normalizeSeverity
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

        socket.emit('session:joined', {
          sessionCode,
          roster: record.trainees,
          currentTimelineIndex: record.currentTimelineIndex
        });

        socket.to(room).emit('session:joined', {
          sessionCode,
          roster: record.trainees,
          currentTimelineIndex: record.currentTimelineIndex
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
        currentTimelineIndex: session.currentTimelineIndex
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

      escalationService.startTimeline({ io, sessionCode, scenarioDefinition });

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

    socket.on('event:log', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      const action = normalizeActionText(payload?.action);
      const rationale = normalizeRationaleText(payload?.rationale);
      const displayName = normalizeDisplayName(payload?.displayName);

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

      simNamespace.to(room).emit('event:log:broadcast', {
        actorRole: 'trainee',
        displayName,
        action,
        rationale,
        timestampIso: new Date().toISOString()
      });

      auditLogger.event({
        action: 'event:log',
        actor,
        context: buildAuditContext({ sessionCode, displayName, socketId: socket.id }, ['sessionCode', 'displayName', 'socketId']),
        outcome: 'success',
        correlationId: generateRandomUuid()
      });
    });
  });

  logger.info('Socket.IO server initialized', { allowedOrigins, allowAllOrigins });
  return io;
}
