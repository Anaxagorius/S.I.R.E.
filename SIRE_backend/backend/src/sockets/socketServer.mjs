// socketServer.mjs
import { createRequire } from 'module';
import { sessionService } from '../services/sessionService.mjs';
import { scenarioRegistry } from '../services/scenarioRegistry.mjs';
import { escalationService } from '../services/escalationService.mjs';
import { inMemorySessionStore } from '../models/inMemorySessionStore.mjs';
import { securityConfig } from '../config/securityConfig.mjs';
import { auditLogger } from '../config/auditLogger.mjs';
import { buildAuditContext } from '../utils/auditContext.mjs';
import { generateRandomId, normalizeActionText, normalizeDisplayName, normalizeMessageText, normalizeRationaleText, normalizeScenarioKey, normalizeSessionCode, normalizeSeverity } from '../utils/validation.mjs';
const require = createRequire(import.meta.url);
const { Server } = require('socket.io');

const generateCorrelationId = () => generateRandomId();

const emitError = (socket, code, message) => {
    socket.emit('error:occurred', {
        code,
        message,
        correlationId: generateCorrelationId()
    });
};

export function attachSocketServer(httpServer, logger) {
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    const simNamespace = io.of('/sim');

    simNamespace.use((socket, next) => {
        if (!securityConfig.requireApiKey) return next();
        const provided = socket.handshake.headers?.[securityConfig.socketHandshakeHeader];
        const candidate = Array.isArray(provided) ? provided[0] : provided;
        if (securityConfig.apiKey && String(candidate || '') === securityConfig.apiKey) {
            socket.data.auth = { actor: 'api-key', scope: 'socket' };
            return next();
        }
        auditLogger.event({
            action: 'socket:auth:failure',
            actor: 'unknown',
            context: buildAuditContext({ socketId: socket.id }, ['socketId']),
            outcome: 'denied',
            correlationId: generateCorrelationId()
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
            correlationId: generateCorrelationId()
        });

        socket.on('disconnect', () => {
            logger.info('Client disconnected', { id: socket.id });
            auditLogger.event({
                action: 'socket:disconnected',
                actor,
                context: buildAuditContext({ socketId: socket.id }, ['socketId']),
                outcome: 'success',
                correlationId: generateCorrelationId()
            });
        });

        socket.on('session:join', payload => {
            const sessionCode = normalizeSessionCode(payload?.sessionCode);
            const displayName = normalizeDisplayName(payload?.displayName);
            if (!sessionCode || !displayName) {
                emitError(socket, 'INVALID_PAYLOAD', 'sessionCode and displayName are required');
                return;
            }
            try {
                const record = sessionService.joinSession({ sessionCode, socketId: socket.id, displayName });
                const room = `session:${sessionCode}`;
                socket.join(room);
                socket.emit('session:joined', {
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
                    context: buildAuditContext({ sessionCode, displayName, socketId: socket.id }, ['sessionCode', 'displayName', 'socketId']),
                    outcome: 'success',
                    correlationId: generateCorrelationId()
                });
            } catch (err) {
                const code = String(err.message || err);
                auditLogger.event({
                    action: 'session:join',
                    actor,
                    context: buildAuditContext({ sessionCode, displayName, socketId: socket.id }, ['sessionCode', 'displayName', 'socketId']),
                    outcome: 'error',
                    correlationId: generateCorrelationId()
                });
                emitError(socket, code, 'Unable to join session');
            }
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
            const scenarioKey = normalizeScenarioKey(session.scenarioKey);
            const scenarioDefinition = scenarioKey ? scenarioRegistry.getScenarioByKey(scenarioKey) : null;
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
                context: buildAuditContext({ sessionCode, scenarioKey, socketId: socket.id }, ['sessionCode', 'scenarioKey', 'socketId']),
                outcome: 'success',
                correlationId: generateCorrelationId()
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
                correlationId: generateCorrelationId()
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
            const room = `session:${sessionCode}`;
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
                correlationId: generateCorrelationId()
            });
        });
    });

    logger.info('Socket.IO server initialized');
    return io;
}
