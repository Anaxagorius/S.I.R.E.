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
  normalizeSeverity,
  normalizeInjectId,
  normalizeActionItemText,
  normalizeChannel,
  normalizePressureType,
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
      const channel = normalizeChannel(payload?.channel);
      const pressureType = normalizePressureType(payload?.pressureType);
      const requiresApproval = payload?.requiresApproval === true;
      const approvalRole = requiresApproval ? normalizeRole(payload?.approvalRole) : null;

      if (!sessionCode || !message) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode and message are required');
        return;
      }

      const session = inMemorySessionStore.getSession(sessionCode);
      if (!session) {
        emitError(socket, 'SESSION_NOT_FOUND', 'Session not found');
        return;
      }

      const inject = inMemorySessionStore.addInjectToQueue(sessionCode, { message, severity, roleFilter, channel, pressureType, requiresApproval, approvalRole });

      const room = `session:${sessionCode}`;
      // Broadcast updated queue to admin (same room)
      simNamespace.to(room).emit('inject:queue:updated', {
        sessionCode,
        injectQueue: inMemorySessionStore.getInjectQueue(sessionCode),
      });

      auditLogger.event({
        action: 'admin:inject:queue:add',
        actor,
        context: buildAuditContext({ sessionCode, injectId: inject.id, channel, pressureType, requiresApproval, socketId: socket.id }, ['sessionCode', 'injectId', 'channel', 'pressureType', 'requiresApproval', 'socketId']),
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

      // Determine target trainees for delivery logging
      const targetTrainees = session.trainees.filter(
        t => !inject.roleFilter || t.role === inject.roleFilter
      );

      // Log delivery for each targeted trainee
      targetTrainees.forEach(t => {
        inMemorySessionStore.addDeliveryEntry(sessionCode, injectId, {
          channel: inject.channel,
          recipient: t.displayName,
          role: t.role,
        });
      });

      // If approval is required and not yet granted, notify only the approver role
      if (inject.requiresApproval && !inject.approvedAt) {
        const approvalPayload = {
          injectId: inject.id,
          sessionCode,
          message: inject.message,
          severity: inject.severity,
          channel: inject.channel,
          pressureType: inject.pressureType,
          approvalRole: inject.approvalRole,
        };

        const approverSockets = Array.from(simNamespace.sockets.values()).filter(s =>
          s.rooms.has(room) && s.data?.participantRole === inject.approvalRole
        );
        approverSockets.forEach(s => s.emit('inject:approval:pending', approvalPayload));

        // Also notify admin sockets so they can see it in their queue
        const adminSockets = Array.from(simNamespace.sockets.values()).filter(s =>
          s.rooms.has(room) && !s.data?.participantRole
        );
        adminSockets.forEach(s => s.emit('inject:queue:updated', {
          sessionCode,
          injectQueue: inMemorySessionStore.getInjectQueue(sessionCode),
        }));

        auditLogger.event({
          action: 'admin:inject:release',
          actor,
          context: buildAuditContext({ sessionCode, injectId, awaitingApproval: true, socketId: socket.id }, ['sessionCode', 'injectId', 'awaitingApproval', 'socketId']),
          outcome: 'success',
          correlationId: generateRandomUuid()
        });
        return;
      }

      // Build event payload for broadcast
      const eventPayload = {
        actorRole: 'admin',
        displayName: 'Instructor',
        action: inject.message,
        rationale: inject.severity,
        roleFilter: inject.roleFilter,
        channel: inject.channel,
        pressureType: inject.pressureType,
        injectId: inject.id,
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

    socket.on('inject:acknowledge', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      const injectId = normalizeInjectId(payload?.injectId);
      const displayName = normalizeDisplayName(payload?.displayName);
      const role = normalizeRole(payload?.role);

      if (!sessionCode || !injectId || !displayName) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode, injectId, and displayName are required');
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

      const inject = inMemorySessionStore.acknowledgeInject(sessionCode, injectId, { displayName, role });
      if (!inject) {
        emitError(socket, 'INJECT_NOT_FOUND', 'Inject not found or not yet released');
        return;
      }

      // Update admin and participants with acknowledgement status
      simNamespace.to(room).emit('inject:queue:updated', {
        sessionCode,
        injectQueue: inMemorySessionStore.getInjectQueue(sessionCode),
      });

      auditLogger.event({
        action: 'inject:acknowledge',
        actor,
        context: buildAuditContext({ sessionCode, injectId, displayName, socketId: socket.id }, ['sessionCode', 'injectId', 'displayName', 'socketId']),
        outcome: 'success',
        correlationId: generateRandomUuid()
      });
    });

    socket.on('inject:approval:grant', payload => {
      const sessionCode = normalizeSessionCode(payload?.sessionCode);
      const injectId = normalizeInjectId(payload?.injectId);
      const approverDisplayName = normalizeDisplayName(payload?.approverDisplayName);
      const approverRole = normalizeRole(payload?.approverRole);

      if (!sessionCode || !injectId || !approverDisplayName) {
        emitError(socket, 'INVALID_PAYLOAD', 'sessionCode, injectId, and approverDisplayName are required');
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

      // Verify the approver has the required role
      const rawInject = inMemorySessionStore.getInjectQueue(sessionCode)?.find(i => i.id === injectId);
      if (!rawInject) {
        emitError(socket, 'INJECT_NOT_FOUND', 'Inject not found');
        return;
      }
      if (rawInject.approvalRole && rawInject.approvalRole !== approverRole) {
        emitError(socket, 'FORBIDDEN', 'Your role is not authorized to approve this inject');
        return;
      }

      const inject = inMemorySessionStore.approveInject(sessionCode, injectId, { approvedBy: approverDisplayName, approverRole });
      if (!inject) {
        emitError(socket, 'INJECT_NOT_FOUND', 'Inject not found, not released, or already approved');
        return;
      }

      // Now broadcast to the intended audience
      const eventPayload = {
        actorRole: 'admin',
        displayName: 'Instructor',
        action: inject.message,
        rationale: inject.severity,
        roleFilter: inject.roleFilter,
        channel: inject.channel,
        pressureType: inject.pressureType,
        injectId: inject.id,
        timestampIso: inject.approvedAt,
      };

      if (inject.roleFilter) {
        const matchingSockets = Array.from(simNamespace.sockets.values()).filter(s =>
          s.rooms.has(room) && s.data?.participantRole === inject.roleFilter
        );
        matchingSockets.forEach(s => s.emit('event:log:broadcast', eventPayload));

        const adminSockets = Array.from(simNamespace.sockets.values()).filter(s =>
          s.rooms.has(room) && !s.data?.participantRole
        );
        adminSockets.forEach(s => s.emit('event:log:broadcast', eventPayload));
      } else {
        simNamespace.to(room).emit('event:log:broadcast', eventPayload);
      }

      // Notify approver that their approval was recorded (clears pending state)
      socket.emit('inject:approval:granted', { sessionCode, injectId });

      // Update queue for all
      simNamespace.to(room).emit('inject:queue:updated', {
        sessionCode,
        injectQueue: inMemorySessionStore.getInjectQueue(sessionCode),
      });

      auditLogger.event({
        action: 'inject:approval:grant',
        actor,
        context: buildAuditContext({ sessionCode, injectId, approverDisplayName, approverRole, socketId: socket.id }, ['sessionCode', 'injectId', 'approverDisplayName', 'approverRole', 'socketId']),
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
