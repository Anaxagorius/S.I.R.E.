// socketServer.mjs
import { createRequire } from 'module';
import { sessionService } from '../services/sessionService.mjs';
import { scenarioRegistry } from '../services/scenarioRegistry.mjs';
import { escalationService } from '../services/escalationService.mjs';
import { inMemorySessionStore } from '../models/inMemorySessionStore.mjs';
const require = createRequire(import.meta.url);
const { Server } = require('socket.io');

const buildCorrelationId = () => Math.random().toString(36).slice(2, 10);

export function attachSocketServer(httpServer, logger) {
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    const simNamespace = io.of('/sim');

    simNamespace.on('connection', socket => {
        logger.info('Client connected', { id: socket.id });

        socket.on('disconnect', () => {
            logger.info('Client disconnected', { id: socket.id });
        });

        socket.on('session:join', payload => {
            const { sessionCode, displayName } = payload || {};
            if (!sessionCode || !displayName) {
                socket.emit('error:occurred', {
                    code: 'INVALID_PAYLOAD',
                    message: 'sessionCode and displayName are required',
                    correlationId: buildCorrelationId()
                });
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
            } catch (err) {
                const code = String(err.message || err);
                socket.emit('error:occurred', {
                    code,
                    message: 'Unable to join session',
                    correlationId: buildCorrelationId()
                });
            }
        });

        socket.on('session:start', payload => {
            const { sessionCode } = payload || {};
            if (!sessionCode) {
                socket.emit('error:occurred', {
                    code: 'INVALID_PAYLOAD',
                    message: 'sessionCode is required',
                    correlationId: buildCorrelationId()
                });
                return;
            }
            const session = inMemorySessionStore.getSession(sessionCode);
            if (!session) {
                socket.emit('error:occurred', {
                    code: 'SESSION_NOT_FOUND',
                    message: 'Session not found',
                    correlationId: buildCorrelationId()
                });
                return;
            }
            const scenarioDefinition = scenarioRegistry.getScenarioByKey(session.scenarioKey);
            if (!scenarioDefinition) {
                socket.emit('error:occurred', {
                    code: 'SCENARIO_NOT_FOUND',
                    message: 'Scenario not found',
                    correlationId: buildCorrelationId()
                });
                return;
            }
            const room = `session:${sessionCode}`;
            socket.join(room);
            escalationService.startTimeline({ io, sessionCode, scenarioDefinition });
        });

        socket.on('admin:inject', payload => {
            const { sessionCode, message, severity } = payload || {};
            if (!sessionCode || !message || !severity) {
                socket.emit('error:occurred', {
                    code: 'INVALID_PAYLOAD',
                    message: 'sessionCode, message, severity are required',
                    correlationId: buildCorrelationId()
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
        });

        socket.on('event:log', payload => {
            const { sessionCode, action, rationale, displayName } = payload || {};
            if (!sessionCode || !action || !displayName) {
                socket.emit('error:occurred', {
                    code: 'INVALID_PAYLOAD',
                    message: 'sessionCode, action, displayName are required',
                    correlationId: buildCorrelationId()
                });
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
        });
    });

    logger.info('Socket.IO server initialized');
    return io;
}
``
