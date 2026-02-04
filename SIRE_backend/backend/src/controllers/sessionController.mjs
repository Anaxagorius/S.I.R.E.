
/**
 * sessionController.js
 * REST layer delegating to sessionService.
 */
import { sessionService } from '../services/sessionService.mjs'
import { auditLogger } from '../config/auditLogger.mjs'
import { buildAuditContext } from '../utils/auditContext.mjs'
import { isPlainObject, normalizeDisplayName, normalizeScenarioKey, normalizeSessionCode, parseLimit } from '../utils/validation.mjs'

export const sessionController = {
  createSession: (req, res) => {
    try {
      if (!isPlainObject(req.body)) {
        auditLogger.event({
          action: 'session:create',
          actor: req.auth?.actor || 'unknown',
          context: buildAuditContext({ reason: 'invalid_payload' }, ['reason']),
          outcome: 'denied',
          correlationId: req.context?.correlationId,
          requestId: req.context?.requestId,
        })
        return res.status(400).json({ message: 'Invalid payload', correlationId: req.context?.correlationId })
      }
      const scenarioKey = normalizeScenarioKey(req.body.scenarioKey)
      const instructorDisplayName = normalizeDisplayName(req.body.instructorDisplayName)
      if (!scenarioKey || !instructorDisplayName) {
        auditLogger.event({
          action: 'session:create',
          actor: req.auth?.actor || 'unknown',
          context: buildAuditContext({ scenarioKey, reason: 'invalid_payload' }, ['scenarioKey', 'reason']),
          outcome: 'denied',
          correlationId: req.context?.correlationId,
          requestId: req.context?.requestId,
        })
        return res.status(400).json({ message: 'Invalid payload', correlationId: req.context?.correlationId })
      }
      const record = sessionService.createSession({ scenarioKey, instructorDisplayName })
      if (req.io) {
        req.io.of('/sim').emit('session:create', { sessionCode: record.sessionCode, scenarioKey })
      }
      auditLogger.event({
        action: 'session:create',
        actor: req.auth?.actor || 'unknown',
        context: buildAuditContext({ sessionCode: record.sessionCode, scenarioKey, ticketId: req.context?.ticketId }, ['sessionCode', 'scenarioKey', 'ticketId']),
        outcome: 'success',
        correlationId: req.context?.correlationId,
        requestId: req.context?.requestId,
      })
      return res.status(201).json(record)
    } catch (err) {
      const code = String(err.message || err)
      auditLogger.event({
        action: 'session:create',
        actor: req.auth?.actor || 'unknown',
        context: buildAuditContext({ scenarioKey: req.body?.scenarioKey, ticketId: req.context?.ticketId }, ['scenarioKey', 'ticketId']),
        outcome: 'error',
        correlationId: req.context?.correlationId,
        requestId: req.context?.requestId,
      })
      return res.status(code === 'SCENARIO_NOT_FOUND' ? 404 : 500).json({ message: 'Unable to create session', correlationId: req.context?.correlationId })
    }
  },
  listSessions: (req, res) => {
    const limitResult = parseLimit(req.query?.limit, { fallback: 100, min: 1, max: 200 })
    if (!limitResult.valid) {
      auditLogger.event({
        action: 'session:list',
        actor: req.auth?.actor || 'unknown',
        context: buildAuditContext({ reason: 'invalid_limit' }, ['reason']),
        outcome: 'denied',
        correlationId: req.context?.correlationId,
        requestId: req.context?.requestId,
      })
      return res.status(400).json({ message: 'Invalid limit', correlationId: req.context?.correlationId })
    }
    const sessions = sessionService.listSessions(limitResult.value)
    auditLogger.event({
      action: 'session:list',
      actor: req.auth?.actor || 'unknown',
      context: buildAuditContext({ count: sessions.length }, ['count']),
      outcome: 'success',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })
    return res.json(sessions)
  },
  getSession: (req, res) => {
    const sessionCode = normalizeSessionCode(req.params.sessionCode)
    if (!sessionCode) {
      auditLogger.event({
        action: 'session:read',
        actor: req.auth?.actor || 'unknown',
        context: buildAuditContext({ reason: 'invalid_session_code' }, ['reason']),
        outcome: 'denied',
        correlationId: req.context?.correlationId,
        requestId: req.context?.requestId,
      })
      return res.status(400).json({ message: 'Invalid session code', correlationId: req.context?.correlationId })
    }
    const record = sessionService.getSession(sessionCode)
    if (!record) {
      auditLogger.event({
        action: 'session:read',
        actor: req.auth?.actor || 'unknown',
        context: buildAuditContext({ sessionCode }, ['sessionCode']),
        outcome: 'not_found',
        correlationId: req.context?.correlationId,
        requestId: req.context?.requestId,
      })
      return res.status(404).json({ message: 'Not found', correlationId: req.context?.correlationId })
    }
    auditLogger.event({
      action: 'session:read',
      actor: req.auth?.actor || 'unknown',
      context: buildAuditContext({ sessionCode }, ['sessionCode']),
      outcome: 'success',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })
    return res.json(record)
  },
  deleteSession: (req, res) => {
    const sessionCode = normalizeSessionCode(req.params.sessionCode)
    if (!sessionCode) {
      auditLogger.event({
        action: 'session:delete',
        actor: req.auth?.actor || 'unknown',
        context: buildAuditContext({ reason: 'invalid_session_code' }, ['reason']),
        outcome: 'denied',
        correlationId: req.context?.correlationId,
        requestId: req.context?.requestId,
      })
      return res.status(400).json({ message: 'Invalid session code', correlationId: req.context?.correlationId })
    }
    const record = sessionService.removeSession(sessionCode)
    if (!record) {
      auditLogger.event({
        action: 'session:delete',
        actor: req.auth?.actor || 'unknown',
        context: buildAuditContext({ sessionCode }, ['sessionCode']),
        outcome: 'not_found',
        correlationId: req.context?.correlationId,
        requestId: req.context?.requestId,
      })
      return res.status(404).json({ message: 'Not found', correlationId: req.context?.correlationId })
    }
    auditLogger.event({
      action: 'session:delete',
      actor: req.auth?.actor || 'unknown',
      context: buildAuditContext({ sessionCode, ticketId: req.context?.ticketId }, ['sessionCode', 'ticketId']),
      outcome: 'success',
      correlationId: req.context?.correlationId,
      requestId: req.context?.requestId,
    })
    return res.json(record)
  },
}
