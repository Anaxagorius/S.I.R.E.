
/** healthRoute.js */
import { Router } from 'express'
import { auditLogger } from '../config/auditLogger.mjs'
import { buildAuditContext } from '../utils/auditContext.mjs'
const router = Router()
router.get('/health', (req, res) => {
  auditLogger.event({
    action: 'health:check',
    actor: req.auth?.actor || 'unknown',
    context: buildAuditContext({ path: req.path }, ['path']),
    outcome: 'success',
    correlationId: req.context?.correlationId,
    requestId: req.context?.requestId,
  })
  res.json({ status: 'ok', timestampIso: new Date().toISOString(), requestId: req.context?.requestId })
})
export default router
