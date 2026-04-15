/**
 * sessionsRoute.mjs
 * Session management endpoints for the new frontend API contract.
 * POST /sessions  - create a session (accepts { scenario })
 * POST /sessions/join - join a session (accepts { sessionKey })
 */
import { Router } from 'express'
import { sessionService } from '../services/sessionService.mjs'
import { auditLogger } from '../config/auditLogger.mjs'
import { buildAuditContext } from '../utils/auditContext.mjs'
import { isPlainObject, normalizeScenarioKey, normalizeSessionCode } from '../utils/validation.mjs'
import { requireAuth, requireRole } from '../middleware/authMiddleware.mjs'

const router = Router()

/** POST /sessions - creates a new session using the provided scenario key. */
router.post('/sessions', requireAuth, requireRole('admin', 'facilitator'), (req, res) => {
  try {
    if (!isPlainObject(req.body)) {
      return res.status(400).json({ message: 'Invalid payload', correlationId: req.context?.correlationId })
    }

    const scenarioKey = normalizeScenarioKey(req.body.scenario)
    if (!scenarioKey) {
      return res.status(400).json({ message: 'Scenario is required', correlationId: req.context?.correlationId })
    }

    // Use a default instructor name when not provided
    const instructorDisplayName = 'Instructor'

    const record = sessionService.createSession({ scenarioKey, instructorDisplayName })

    if (req.io) {
      req.io.of('/sim').emit('session:create', { sessionCode: record.sessionCode, scenarioKey })
    }

    auditLogger.event({
      action: 'sessions:create',
      actor: req.auth?.actor || 'unknown',
      context: buildAuditContext(
        { sessionCode: record.sessionCode, scenarioKey, ticketId: req.context?.ticketId },
        ['sessionCode', 'scenarioKey', 'ticketId']
      ),
      outcome: 'success',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })

    return res.status(201).json({ sessionKey: record.sessionCode, ...record })
  } catch (err) {
    const code = String(err.message || err)
    auditLogger.event({
      action: 'sessions:create',
      actor: req.auth?.actor || 'unknown',
      context: buildAuditContext({ scenarioKey: req.body?.scenario }, ['scenarioKey']),
      outcome: 'error',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })
    return res.status(code === 'SCENARIO_NOT_FOUND' ? 404 : 500).json({
      message: code === 'SCENARIO_NOT_FOUND' ? 'Scenario not found' : 'Unable to create session',
      correlationId: req.context?.correlationId,
    })
  }
})

/** POST /sessions/join - joins an existing session using a session key. */
router.post('/sessions/join', (req, res) => {
  try {
    if (!isPlainObject(req.body)) {
      return res.status(400).json({ message: 'Invalid payload', correlationId: req.context?.correlationId })
    }

    const sessionCode = normalizeSessionCode(req.body.sessionKey)
    if (!sessionCode) {
      return res.status(400).json({ message: 'Session key is required', correlationId: req.context?.correlationId })
    }

    const session = sessionService.getSession(sessionCode)
    if (!session) {
      auditLogger.event({
        action: 'sessions:join',
        actor: req.auth?.actor || 'unknown',
        context: buildAuditContext({ sessionCode }, ['sessionCode']),
        outcome: 'not_found',
        correlationId: req.context?.correlationId,
        requestId: req.context?.requestId,
      })
      return res.status(404).json({ message: 'Session not found', correlationId: req.context?.correlationId })
    }

    auditLogger.event({
      action: 'sessions:join',
      actor: req.auth?.actor || 'unknown',
      context: buildAuditContext({ sessionCode }, ['sessionCode']),
      outcome: 'success',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })

    return res.json({ sessionKey: session.sessionCode, scenarioKey: session.scenarioKey })
  } catch (err) {
    const code = String(err.message || err)
    auditLogger.event({
      action: 'sessions:join',
      actor: req.auth?.actor || 'unknown',
      context: buildAuditContext({ sessionKey: req.body?.sessionKey }, ['sessionKey']),
      outcome: 'error',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })
    return res.status(code === 'SESSION_AT_CAPACITY' ? 409 : 500).json({
      message: code === 'SESSION_AT_CAPACITY' ? 'Session is at capacity' : 'Unable to join session',
      correlationId: req.context?.correlationId,
    })
  }
})

export default router
