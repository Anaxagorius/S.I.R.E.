/**
 * exportRoute.mjs
 * Provides exportable session artifacts for audit and after-action review.
 *
 * GET /api/sessions/:sessionCode/export  - full session snapshot (JSON)
 */
import { Router } from 'express'
import { inMemorySessionStore } from '../models/inMemorySessionStore.mjs'
import { auditLogger } from '../config/auditLogger.mjs'
import { buildAuditContext } from '../utils/auditContext.mjs'
import { normalizeSessionCode } from '../utils/validation.mjs'

const router = Router()

/** GET /api/sessions/:sessionCode/export — returns a full session snapshot for download/audit. */
router.get('/sessions/:sessionCode/export', (req, res) => {
  const sessionCode = normalizeSessionCode(req.params.sessionCode)
  if (!sessionCode) {
    return res.status(400).json({ message: 'Invalid session code', correlationId: req.context?.correlationId })
  }

  const session = inMemorySessionStore.getSession(sessionCode)
  if (!session) {
    return res.status(404).json({ message: 'Session not found', correlationId: req.context?.correlationId })
  }

  auditLogger.event({
    action: 'session:export',
    actor: req.auth?.actor || 'unknown',
    context: buildAuditContext({ sessionCode }, ['sessionCode']),
    outcome: 'success',
    correlationId: req.context?.correlationId,
    requestId: req.context?.requestId,
  })

  const snapshot = {
    sessionCode: session.sessionCode,
    scenarioKey: session.scenarioKey,
    instructorDisplayName: session.instructorDisplayName,
    createdAt: new Date(session.createdAtEpochMs).toISOString(),
    startedAt: session.startedAt || null,
    endedAt: session.endedAt || null,
    exportedAt: new Date().toISOString(),
    participants: session.trainees.map(t => ({
      displayName: t.displayName,
      role: t.role || null,
      joinedAt: t.joinedAt || null,
    })),
    eventLog: session.eventLog,
    actionItems: session.actionItems,
    injectLog: session.injectQueue.map(inj => ({
      id: inj.id,
      message: inj.message,
      originalMessage: inj.originalMessage || null,
      severity: inj.severity,
      roleFilter: inj.roleFilter || null,
      released: inj.released,
      releasedAt: inj.releasedAt || null,
      createdAt: inj.createdAt,
      notes: inj.notes || [],
    })),
  }

  return res.json(snapshot)
})

export default router
